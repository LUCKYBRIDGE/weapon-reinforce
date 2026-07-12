import { access, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  isQuizImageAsset,
  parseCsvQuizPack,
  QUIZ_PACKS,
  QUIZ_TOTAL_QUESTION_COUNT,
} from '../src/data/quizCatalog.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const quizRoot = resolve(projectRoot, 'public', 'quiz');
const ids = new Set();
let total = 0;
let imageReferences = 0;
const checkedAssets = new Set();

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const assertAsset = async (source, context) => {
  const path = String(source).replace(/\?.*$/, '').replace(/^\.\//, '');
  const normalizedPath = normalize(path);
  assert(!isAbsolute(normalizedPath) && !normalizedPath.startsWith(`..`), `${context}: 허용되지 않은 자산 경로입니다 (${path})`);
  const assetPath = resolve(quizRoot, 'nets', normalizedPath);
  await access(assetPath).catch(() => {
    throw new Error(`${context}: SVG 자산이 없습니다 (${path})`);
  });
  if (!checkedAssets.has(assetPath)) {
    const svg = await readFile(assetPath, 'utf8');
    assert(!/<script\b/i.test(svg), `${context}: SVG에 script 태그가 있습니다 (${path})`);
    assert(!/<foreignObject\b/i.test(svg), `${context}: SVG에 foreignObject가 있습니다 (${path})`);
    assert(!/\son[a-z]+\s*=/i.test(svg), `${context}: SVG에 이벤트 핸들러가 있습니다 (${path})`);
    assert(!/(?:href|src)\s*=\s*["'](?:https?:|\/\/|data:text\/html)/i.test(svg), `${context}: SVG에 외부 실행 자원이 있습니다 (${path})`);
    checkedAssets.add(assetPath);
  }
  imageReferences += 1;
};

for (const pack of QUIZ_PACKS) {
  const dataPath = resolve(quizRoot, 'data', pack.file);
  const source = await readFile(dataPath, 'utf8');
  let questions;

  if (pack.kind === 'csv') {
    questions = parseCsvQuizPack(source, pack);
  } else {
    const payload = JSON.parse(source);
    questions = Array.isArray(payload.questions) ? payload.questions : [];
    for (const question of questions) {
      const answer = String(question.answer || '').trim();
      const choices = Array.isArray(question.choices) ? question.choices.map(String) : [];
      assert(choices.includes(answer), `${pack.id}/${question.id}: 정답이 선택지에 없습니다.`);
      const possibleImages = [question.question, ...choices].filter(isQuizImageAsset);
      for (const image of possibleImages) await assertAsset(image, `${pack.id}/${question.id}`);
    }
  }

  assert(questions.length === pack.questionCount, `${pack.label}: ${pack.questionCount}문항이어야 하지만 ${questions.length}문항입니다.`);
  for (const question of questions) {
    const id = String(question.id || '').trim();
    assert(id, `${pack.id}: ID가 없는 문항이 있습니다.`);
    assert(!ids.has(id), `중복 문항 ID가 있습니다: ${id}`);
    ids.add(id);
  }
  assert(pack.reward[0] > 0 && pack.reward[1] >= pack.reward[0], `${pack.label}: 보상 범위가 잘못되었습니다.`);
  total += questions.length;
}

const manifest = JSON.parse(await readFile(resolve(quizRoot, 'weapon-reinforce-manifest.json'), 'utf8'));
assert(total === QUIZ_TOTAL_QUESTION_COUNT, `카탈로그 합계 ${QUIZ_TOTAL_QUESTION_COUNT}와 실제 ${total}이 다릅니다.`);
assert(manifest.questionCount === total, '퀴즈 출처 매니페스트의 문항 수가 실제 데이터와 다릅니다.');
assert(manifest.packCount === QUIZ_PACKS.length, '퀴즈 출처 매니페스트의 팩 수가 실제 카탈로그와 다릅니다.');

console.log(`퀴즈 ${QUIZ_PACKS.length}팩, ${total}문항, SVG ${checkedAssets.size}개·참조 ${imageReferences}건 검증 통과`);
