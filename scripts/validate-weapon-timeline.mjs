import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  CURIOSITIES,
  CURIOSITY_RARITIES,
  getCuriosityMetrics,
  getCuriositySaleImpact,
  RESTORE_SHOP_PRICES,
  TIMELINE_UPGRADE_RATES,
  TITLE_DEFINITIONS,
  WEAPON_TIMELINE,
} from '../src/data/weaponTimeline.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tiers = Object.keys(WEAPON_TIMELINE).map(Number).sort((a, b) => a - b);
const rates = Object.keys(TIMELINE_UPGRADE_RATES).map(Number).sort((a, b) => a - b);
const combatStyles = new Set(['firearm', 'polearm-slash', 'heavy-slash', 'saber-slash', 'resonance', 'dagger-thrust']);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(tiers.length === 7, `역사 무기는 7단계여야 합니다. 현재 ${tiers.length}단계입니다.`);
assert(tiers.every((tier, index) => tier === index + 1), '역사 무기 단계가 +1부터 연속적이지 않습니다.');
assert(rates.length === tiers.length - 1, '최종 단계를 제외한 모든 강화 확률이 필요합니다.');

for (const tier of tiers) {
  const weapon = WEAPON_TIMELINE[tier];
  for (const field of ['name', 'era', 'yearLabel', 'fact', 'gameLore', 'sourceTitle', 'sourceUrl', 'image', 'combatStyle', 'combatProfile', 'battlePose']) {
    assert(Boolean(weapon[field]), `+${tier} ${field} 정보가 비어 있습니다.`);
  }
  assert(weapon.sourceUrl.startsWith('https://'), `+${tier} 출처 URL은 HTTPS여야 합니다.`);
  assert(combatStyles.has(weapon.combatStyle), `+${tier} 전투 연출 유형이 허용 목록에 없습니다.`);
  assert(typeof weapon.combatProfile.attackName === 'string' && weapon.combatProfile.attackName, `+${tier} 공격 이름이 없습니다.`);
  assert(weapon.combatProfile.critChance >= 0 && weapon.combatProfile.critChance <= 1, `+${tier} 치명타 확률이 범위를 벗어났습니다.`);
  assert(weapon.combatProfile.critMultiplier >= 1, `+${tier} 치명타 배율이 1보다 작습니다.`);
  for (const poseName of ['held', 'firstPerson']) {
    const pose = weapon.battlePose[poseName];
    const positionField = poseName === 'held' ? 'top' : 'bottom';
    assert(pose && ['left', positionField, 'width', 'rotation', 'flip'].every(field => Object.hasOwn(pose, field)), `+${tier} ${poseName} 전투 위치가 불완전합니다.`);
  }
  await access(resolve(projectRoot, 'public', 'images', weapon.image));
}

for (let index = 0; index < rates.length; index += 1) {
  const tier = rates[index];
  const current = TIMELINE_UPGRADE_RATES[tier];
  assert(current.cost > 0, `+${tier} 강화 비용은 0보다 커야 합니다.`);
  assert(current.rate > 0 && current.rate <= 100, `+${tier} 강화 확률이 범위를 벗어났습니다.`);
  if (index > 0) {
    const previous = TIMELINE_UPGRADE_RATES[rates[index - 1]];
    assert(current.rate < previous.rate, `+${tier} 강화 확률은 전 단계보다 낮아야 합니다.`);
    assert(current.cost > previous.cost, `+${tier} 강화 비용은 전 단계보다 높아야 합니다.`);
  }
}

const curiosityIds = new Set(CURIOSITIES.map(({ id }) => id));
assert(CURIOSITIES.length >= 10, '랜덤성을 위해 괴작은 최소 10종이 필요합니다.');
assert(curiosityIds.size === CURIOSITIES.length, '중복된 괴작 ID가 있습니다.');
for (const curiosity of CURIOSITIES) {
  assert(CURIOSITY_RARITIES[curiosity.rarity], `${curiosity.name}의 희귀도가 정의되지 않았습니다.`);
  assert(curiosity.price > 0, `${curiosity.name}의 판매 가격은 0보다 커야 합니다.`);
}

assert(TITLE_DEFINITIONS.some(({ type }) => type === 'permanent'), '영구 발견 칭호가 필요합니다.');
assert(TITLE_DEFINITIONS.some(({ type }) => type === 'possession'), '보유 조건 칭호가 필요합니다.');
const titleIds = new Set(TITLE_DEFINITIONS.map(({ id }) => id));
assert(titleIds.size === TITLE_DEFINITIONS.length, '중복된 칭호 ID가 있습니다.');
for (const title of TITLE_DEFINITIONS) {
  assert(['permanent', 'possession'].includes(title.type), `${title.name}의 칭호 유형이 잘못되었습니다.`);
  assert(Number.isInteger(title.reward) && title.reward > 0, `${title.name}의 1회 보상은 양의 정수여야 합니다.`);
  assert(typeof title.check === 'function', `${title.name}의 달성 조건 함수가 없습니다.`);
}

const protectedInventory = {
  'grandmothers-kindling': 1,
  'soot-fire-tongs': 4,
};
const protectedDiscoveries = {
  'grandmothers-kindling': 1,
  'soot-fire-tongs': 4,
};
const protectedMetrics = getCuriosityMetrics({ inventory: protectedInventory, discoveries: protectedDiscoveries });
assert(protectedMetrics.ownedTotal === 5, '괴작 보유 합계를 잘못 계산했습니다.');
const protectedSale = getCuriositySaleImpact({ inventory: protectedInventory, discoveries: protectedDiscoveries }, 'grandmothers-kindling', 1);
assert(protectedSale.deactivatedTitles.some(title => title.id === 'grandmothers-firekeeper'), '마지막 불쏘시개 판매가 보유 칭호에 미치는 영향을 찾지 못했습니다.');
assert(protectedSale.deactivatedTitles.some(title => title.id === 'curiosity-holder'), '보유 합계 감소가 수집 칭호에 미치는 영향을 찾지 못했습니다.');
const duplicateSale = getCuriositySaleImpact({
  inventory: { ...protectedInventory, 'grandmothers-kindling': 3 },
  discoveries: protectedDiscoveries,
}, 'grandmothers-kindling', 2);
assert(!duplicateSale.deactivatedTitles.some(title => title.id === 'grandmothers-firekeeper'), '한 개를 남기는 중복 판매가 보유 칭호를 잘못 비활성화합니다.');
assert(duplicateSale.nextInventory['grandmothers-kindling'] === 1, '중복 괴작 판매 뒤 한 개가 남지 않았습니다.');

const restoreTiers = Object.keys(RESTORE_SHOP_PRICES).map(Number).sort((a, b) => a - b);
assert(restoreTiers[0] === 1, '복원 상점에는 기본 K2 단계가 필요합니다.');
for (let index = 1; index < restoreTiers.length; index += 1) {
  assert(
    RESTORE_SHOP_PRICES[restoreTiers[index]] > RESTORE_SHOP_PRICES[restoreTiers[index - 1]],
    '복원 무기 가격은 단계가 높을수록 비싸야 합니다.',
  );
}

console.log(`무기 ${tiers.length}단계, 괴작 ${CURIOSITIES.length}종, 칭호 ${TITLE_DEFINITIONS.length}종 검증 통과`);
