import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const readText = path => readFile(resolve(projectRoot, path), 'utf8');
const readJson = async path => JSON.parse(await readText(path));

const packageJson = await readJson('package.json');
const version = packageJson.version;
const tag = `v${version}`;

const [checklist, releaseNotes, readme, status] = await Promise.all([
  readText('CHECKLIST.md'),
  readText(`docs/releases/v${version}.md`),
  readText('README.md'),
  readText('PROJECT_STATUS.md'),
]);

const manualGateMarkers = [
  'OS 파일 선택 창에서 같은 파일을 고르는 마지막 UI 왕복',
  '1.2-02: 실제 390px 브라우저에서 터치 선택과 가로 넘침',
  '1.2-04: 실제 데스크톱·390px 브라우저에서 전투 피드백 배지가 대사창/HP를 가리지 않는지',
];

const checklistLines = checklist.split(/\r?\n/);
const unchecked = checklistLines.filter(line => /^- \[ \]/.test(line.trim()));

assert(
  unchecked.length === 0,
  `정식 릴리스 전에 미완료 체크가 없어야 합니다:\n${unchecked.join('\n')}`,
);

for (const marker of manualGateMarkers) {
  const completedLine = checklistLines.find(line => (
    /^- \[[xX]\]/.test(line.trim())
    && line.includes(marker)
  ));
  assert(completedLine, `수동 릴리스 게이트가 완료 처리되지 않았습니다: ${marker}`);
}

assert(
  releaseNotes.includes('상태: **정식 릴리스(Stable)**'),
  `docs/releases/${tag}.md 상태를 정식 릴리스(Stable)로 바꾼 뒤 발행해야 합니다.`,
);
assert(
  !releaseNotes.includes('릴리스 후보(Release Candidate)'),
  '릴리스 노트에 Release Candidate 상태가 남아 있습니다.',
);
assert(
  readme.includes(`현재 출시 버전: \`${version}\``),
  'README의 현재 버전을 릴리스 후보가 아닌 현재 출시 버전으로 확정해야 합니다.',
);
assert(
  !readme.includes('현재 릴리스 후보:'),
  'README에 릴리스 후보 문구가 남아 있습니다.',
);
assert(
  status.includes(`현재 출시 버전: \`${version}\``),
  'PROJECT_STATUS의 현재 버전을 출시 버전으로 확정해야 합니다.',
);
assert(
  !status.includes('현재 릴리스 후보:'),
  'PROJECT_STATUS에 릴리스 후보 문구가 남아 있습니다.',
);

console.log(
  `정식 릴리스 발행 검증 통과 · ${tag} · 수동 게이트 ${manualGateMarkers.length}건 완료 · RC 문구 제거 완료`,
);
