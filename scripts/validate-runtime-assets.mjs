import { access, readFile, readdir, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EXPEDITION_ASSET_FILES } from '../src/data/expedition.js';
import { isQuizImageAsset, QUIZ_PACKS } from '../src/data/quizCatalog.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = resolve(projectRoot, 'dist');
const maxRuntimeBytes = 10 * 1024 * 1024;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return nested.flat();
};

await access(resolve(distRoot, 'index.html')).catch(() => {
  throw new Error('dist/index.html이 없습니다. 먼저 npm run build를 실행하세요.');
});

for (const requiredPath of [
  'favicon.svg',
  'images/anvil_bg.png',
  'quiz/weapon-reinforce-manifest.json',
  ...Array.from({ length: 7 }, (_, index) => `images/weapon_timeline_${index + 1}.png`),
  ...EXPEDITION_ASSET_FILES.map(fileName => `images/${fileName}`),
]) {
  await access(resolve(distRoot, requiredPath)).catch(() => {
    throw new Error(`필수 런타임 자산이 없습니다: ${requiredPath}`);
  });
}

const files = await walk(distRoot);
const relativeFiles = files.map(file => relative(distRoot, file).replaceAll('\\', '/'));
const forbidden = relativeFiles.filter(file => /(?:^|\/)(?:adventure|rabbit|turtle|yisun_actions|tests?)(?:\/|$)/i.test(file));
assert(forbidden.length === 0, `분리된 모험 자산이 배포물에 포함되었습니다: ${forbidden.slice(0, 3).join(', ')}`);

const expectedQuizFiles = new Set(['weapon-reinforce-manifest.json']);
for (const pack of QUIZ_PACKS) {
  const dataFile = `data/${pack.file}`;
  expectedQuizFiles.add(dataFile);
  if (pack.kind !== 'json') continue;

  const payload = JSON.parse(await readFile(resolve(distRoot, 'quiz', dataFile), 'utf8'));
  const questions = Array.isArray(payload.questions) ? payload.questions : [];
  for (const question of questions) {
    const candidates = [question.question, question.image, ...(Array.isArray(question.choices) ? question.choices : [])];
    for (const candidate of candidates.filter(isQuizImageAsset)) {
      const asset = String(candidate)
        .trim()
        .replace(/\?.*$/, '')
        .replace(/^\.\//, '')
        .replace(/^assets\/quiz\/nets\//, '')
        .replace(/^quiz\/nets\//, '');
      assert(/\.svg$/i.test(asset), `${pack.id}: 배포 가능한 퀴즈 그림은 SVG만 허용됩니다 (${asset})`);
      expectedQuizFiles.add(`nets/${asset}`);
    }
  }
}

const actualQuizFiles = new Set(
  relativeFiles.filter(file => file.startsWith('quiz/')).map(file => file.slice('quiz/'.length)),
);
const missingQuizFiles = [...expectedQuizFiles].filter(file => !actualQuizFiles.has(file));
const unexpectedQuizFiles = [...actualQuizFiles].filter(file => !expectedQuizFiles.has(file));
assert(missingQuizFiles.length === 0, `배포 퀴즈 필수 파일이 없습니다: ${missingQuizFiles.slice(0, 3).join(', ')}`);
assert(unexpectedQuizFiles.length === 0, `배포 허용 목록 밖의 퀴즈 파일이 있습니다: ${unexpectedQuizFiles.slice(0, 3).join(', ')}`);

const sizes = await Promise.all(files.map(file => stat(file).then(info => info.size)));
const totalBytes = sizes.reduce((sum, size) => sum + size, 0);
assert(totalBytes <= maxRuntimeBytes, `배포물 크기가 10MB 상한을 넘었습니다: ${(totalBytes / 1024 / 1024).toFixed(1)}MB`);

const productionJsFiles = files.filter(file => /(?:^|\/)assets\/[^/]+\.js$/i.test(relative(distRoot, file).replaceAll('\\', '/')));
const forbiddenDevMarkers = [
  'release-qa-',
  '1.2 릴리스 QA 빠른 재현',
  '릴리스 QA 탐사',
];
const leakedDevMarkers = [];
for (const file of productionJsFiles) {
  const source = await readFile(file, 'utf8');
  for (const marker of forbiddenDevMarkers) {
    if (source.includes(marker)) {
      leakedDevMarkers.push(`${relative(distRoot, file).replaceAll('\\', '/')}: ${marker}`);
    }
  }
}
assert(
  leakedDevMarkers.length === 0,
  `DEV 릴리스 QA 코드가 프로덕션 JS에 포함되었습니다: ${leakedDevMarkers.slice(0, 3).join(', ')}`,
);

const indexHtml = await readFile(resolve(distRoot, 'index.html'), 'utf8');
assert(indexHtml.includes('/weapon-reinforce/'), '프로덕션 index.html에 /weapon-reinforce/ base path가 없습니다.');
assert(indexHtml.includes('<html lang="ko">'), '프로덕션 문서 언어가 한국어로 설정되지 않았습니다.');
assert(indexHtml.includes('name="description"'), '프로덕션 문서에 검색 설명이 없습니다.');
assert(indexHtml.includes('시간역행 대장간 | 한국 무기 강화·역사 퀴즈'), '프로덕션 문서 제목이 출시명과 다릅니다.');

console.log(`런타임 자산 ${files.length}개, ${(totalBytes / 1024 / 1024).toFixed(1)}MB 검증 통과 · 퀴즈 허용 파일 ${expectedQuizFiles.size}개 · 한국어 문서 메타데이터 · 분리 모험 자산 0개 · DEV 릴리스 QA 누출 0개`);
