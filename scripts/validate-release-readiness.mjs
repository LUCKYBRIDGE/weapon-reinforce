import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { WEAPON_TIMELINE } from '../src/data/weaponTimeline.js';
import { QUIZ_PACKS, QUIZ_TOTAL_QUESTION_COUNT } from '../src/data/quizCatalog.js';
import {
  EXPEDITION_ENEMIES,
  EXPEDITION_EVENTS,
  EXPEDITION_HISTORY_LAYERS,
  EXPEDITION_NPCS,
  EXPEDITION_REGIONS,
} from '../src/data/expeditionCatalog.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const readText = path => readFile(resolve(projectRoot, path), 'utf8');
const readJson = async path => JSON.parse(await readText(path));

const packageJson = await readJson('package.json');
const packageLock = await readJson('package-lock.json');
const version = packageJson.version;

assert(version && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version), 'package.json version이 유효한 semver가 아닙니다.');
assert(packageLock.version === version, 'package-lock.json 최상위 version이 package.json과 다릅니다.');
assert(packageLock.packages?.['']?.version === version, 'package-lock packages[""].version이 package.json과 다릅니다.');

const [readme, checklist, status, agents, releaseNotes] = await Promise.all([
  readText('README.md'),
  readText('CHECKLIST.md'),
  readText('PROJECT_STATUS.md'),
  readText('AGENTS.md'),
  readText(`docs/releases/v${version}.md`),
]);

assert(
  checklist.startsWith(`# Weapon Reinforce ${version} 검증 체크리스트`),
  'CHECKLIST 제목이 package version과 일치하지 않습니다.',
);
assert(
  status.includes(`현재 릴리스 후보: \`${version}\``) || status.includes(`현재 출시 버전: \`${version}\``),
  'PROJECT_STATUS의 현재 버전 표기가 package version과 일치하지 않습니다.',
);
assert(
  agents.includes(`Package version \`${version}\``),
  'AGENTS의 package baseline이 package version과 일치하지 않습니다.',
);
assert(
  releaseNotes.startsWith(`# Weapon Reinforce ${version}`),
  '릴리스 노트 제목이 package version과 일치하지 않습니다.',
);

const expectedCounts = {
  weapons: Object.keys(WEAPON_TIMELINE).length,
  quizPacks: QUIZ_PACKS.length,
  quizQuestions: QUIZ_TOTAL_QUESTION_COUNT,
  regions: EXPEDITION_REGIONS.length,
  historyLayers: EXPEDITION_HISTORY_LAYERS.length,
  enemies: EXPEDITION_ENEMIES.length,
  npcs: EXPEDITION_NPCS.length,
  events: EXPEDITION_EVENTS.length,
};

assert(readme.includes(`${expectedCounts.quizPacks}종, ${expectedCounts.quizQuestions}문항`), 'README 퀴즈팩/문항 수가 실제 데이터와 다릅니다.');
assert(readme.includes(`${expectedCounts.historyLayers}개 역사층`), 'README 역사층 수가 실제 데이터와 다릅니다.');
assert(
  readme.includes(`적 ${expectedCounts.enemies}종, NPC ${expectedCounts.npcs}종, 사건 ${expectedCounts.events}종`),
  'README 탐사 조우 수가 실제 카탈로그와 다릅니다.',
);
assert(readme.includes('선택형 지원 조우'), 'README에 1.2 선택형 지원 조우가 반영되지 않았습니다.');
assert(readme.includes('게임 전투 효과'), 'README에 1.2 무기 전투 피드백이 반영되지 않았습니다.');

const manualGateMarkers = [
  'OS 파일 선택 창에서 같은 파일을 고르는 마지막 UI 왕복',
  '1.2-02: 실제 390px 브라우저에서 터치 선택과 가로 넘침',
  '1.2-04: 실제 데스크톱·390px 브라우저에서 전투 피드백 배지가 대사창/HP를 가리지 않는지',
];

for (const marker of manualGateMarkers) {
  assert(checklist.includes(marker), `수동 릴리스 게이트가 CHECKLIST에서 사라졌습니다: ${marker}`);
}

const unchecked = checklist
  .split(/\r?\n/)
  .filter(line => /^- \[ \]/.test(line.trim()));

assert(
  unchecked.every(line => manualGateMarkers.some(marker => line.includes(marker))),
  `알려진 수동 게이트 외 미완료 체크가 있습니다:\n${unchecked.join('\n')}`,
);

assert(
  expectedCounts.weapons === 7
  && expectedCounts.regions === 3
  && expectedCounts.historyLayers === 7,
  '1.2 핵심 콘텐츠 기준선(무기 7·지역 3·역사층 7)이 바뀌었습니다.',
);

console.log(
  `릴리스 자동 준비 검증 통과 · v${version} · 무기 ${expectedCounts.weapons} · 퀴즈 ${expectedCounts.quizPacks}팩/${expectedCounts.quizQuestions}문항 · 탐사 적/NPC/사건 ${expectedCounts.enemies}/${expectedCounts.npcs}/${expectedCounts.events} · 수동 게이트 ${unchecked.length}건`,
);
