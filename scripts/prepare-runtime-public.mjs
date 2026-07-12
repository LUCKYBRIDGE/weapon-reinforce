import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EXPEDITION_ASSET_FILES } from '../src/data/expedition.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(projectRoot, 'public');
const runtimeRoot = resolve(projectRoot, '.runtime-public');
const runtimeImages = resolve(runtimeRoot, 'images');

await rm(runtimeRoot, { recursive: true, force: true });
await mkdir(runtimeImages, { recursive: true });

await cp(resolve(sourceRoot, 'favicon.svg'), resolve(runtimeRoot, 'favicon.svg'));
await cp(resolve(sourceRoot, 'quiz'), resolve(runtimeRoot, 'quiz'), { recursive: true });
await cp(resolve(sourceRoot, 'images', 'anvil_bg.png'), resolve(runtimeImages, 'anvil_bg.png'));

const imageFiles = await readdir(resolve(sourceRoot, 'images'));
const weaponFiles = imageFiles.filter(fileName => /^weapon_timeline_[1-7]\.png$/.test(fileName));
for (const fileName of weaponFiles) {
  await cp(resolve(sourceRoot, 'images', fileName), resolve(runtimeImages, fileName));
}

for (const fileName of EXPEDITION_ASSET_FILES) {
  await cp(resolve(sourceRoot, 'images', fileName), resolve(runtimeImages, fileName));
}

if (weaponFiles.length !== 7) {
  throw new Error(`시간역행 무기 이미지는 7개여야 합니다. 현재 ${weaponFiles.length}개입니다.`);
}

console.log(`런타임 공개 자산 준비 완료: 무기 ${weaponFiles.length}종 + 탐사 ${EXPEDITION_ASSET_FILES.length}종 + 모루 + 퀴즈`);
