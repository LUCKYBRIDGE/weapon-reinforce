import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  advanceExpeditionCombat,
  applyExpeditionSettlement,
  beginEnemyCombat,
  continueExpedition,
  createExpeditionRun,
  EXPEDITION_ASSET_FILES,
  EXPEDITION_ENCOUNTERS,
  EXPEDITION_ENEMIES,
  EXPEDITION_EVENTS,
  EXPEDITION_HISTORY_LAYERS,
  EXPEDITION_NPCS,
  EXPEDITION_REGIONS,
  EXPEDITION_RULES,
  EXPEDITION_STATS_INITIAL,
  finishVictoryScene,
  getExpeditionHistoryLayer,
  resolveEventEncounter,
  resolveNpcEncounter,
  sanitizeExpeditionRun,
  sanitizeExpeditionStats,
  selectExpeditionEncounter,
  settleExpeditionDefeat,
  settleExpeditionReturn,
  unlockExpeditionHistoryCard,
} from '../src/data/expedition.js';
import {
  EXPEDITION_LOOT_TABLES,
  getExpeditionSupply,
} from '../src/data/expeditionEconomy.js';
import { WEAPON_TIMELINE } from '../src/data/weaponTimeline.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lootTableIds = new Set(EXPEDITION_LOOT_TABLES.map(table => table.id));
const sumLoot = loot => Object.values(loot || {}).reduce((sum, count) => sum + count, 0);

assert(EXPEDITION_REGIONS.length >= 3, '탐사 지역은 최소 3곳이어야 합니다.');
assert(EXPEDITION_ENEMIES.length >= 6, '탐사 적은 최소 6종이어야 합니다.');
assert(EXPEDITION_NPCS.length >= 3, '탐사 NPC는 최소 3종이어야 합니다.');
assert(EXPEDITION_EVENTS.length >= 3, '탐사 사건은 최소 3종이어야 합니다.');
assert.equal(EXPEDITION_HISTORY_LAYERS.length, EXPEDITION_RULES.maxDepth, '7개 역사층 카드가 필요합니다.');
assert.equal(EXPEDITION_RULES.version, 3, '탐사 진행 저장은 버전 3이어야 합니다.');
assert.deepEqual(
  EXPEDITION_RULES.encounterTypeWeights,
  { enemy: 60, npc: 23, event: 17 },
  '중간층 조우 유형 확률은 60/23/17이어야 합니다.',
);

const encounterIds = EXPEDITION_ENCOUNTERS.map(({ id }) => id);
assert.equal(new Set(encounterIds).size, encounterIds.length, '적·NPC·사건 ID가 중복되었습니다.');
assert(EXPEDITION_ENEMIES.every(enemy => enemy.fictional === true), '실제 역사 인물을 전투 적으로 사용하면 안 됩니다.');
assert.equal(new Set(EXPEDITION_ENEMIES.map(enemy => enemy.roleLabel)).size, EXPEDITION_ENEMIES.length, '적 역할이 서로 구분되지 않습니다.');
for (const enemy of EXPEDITION_ENEMIES) {
  assert(enemy.traitDescription, `${enemy.id}의 전투 특성 설명이 없습니다.`);
  assert(enemy.combat && enemy.combat.actionName && enemy.combat.telegraph, `${enemy.id}의 일반 공격 예고가 없습니다.`);
  assert(lootTableIds.has(enemy.lootTableId), `${enemy.id}의 전리품 표가 없습니다.`);
}
for (const support of [...EXPEDITION_NPCS, ...EXPEDITION_EVENTS]) {
  assert(support.roleLabel && support.traitDescription, `${support.id}의 도움 역할 설명이 없습니다.`);
  assert(Array.isArray(support.effects) && support.effects.length > 0, `${support.id}의 개별 효과가 없습니다.`);
  assert(lootTableIds.has(support.lootTableId), `${support.id}의 전리품 표가 없습니다.`);
  for (const effect of support.effects) {
    assert(['heal', 'nextAttackBonus', 'nextGuardBonus', 'lootBonus'].includes(effect.kind), `${support.id}의 효과 종류가 잘못되었습니다.`);
    assert(effect.amount > 0, `${support.id}의 효과 수치가 양수가 아닙니다.`);
  }
}

for (const fileName of EXPEDITION_ASSET_FILES) {
  await access(resolve(projectRoot, 'public', 'images', fileName));
}

for (let depth = 1; depth <= EXPEDITION_RULES.maxDepth; depth += 1) {
  const regions = EXPEDITION_REGIONS.filter(region => depth >= region.depthMin && depth <= region.depthMax);
  assert.equal(regions.length, 1, `${depth}층을 담당하는 지역이 정확히 하나가 아닙니다.`);
  const card = getExpeditionHistoryLayer(depth);
  const weapon = WEAPON_TIMELINE[depth];
  assert.equal(card.weaponId, weapon.id, `${depth}층 역사 카드와 무기 연표가 어긋났습니다.`);
  assert.equal(card.sourceUrl, weapon.sourceUrl, `${depth}층 역사 카드 출처가 무기 연표와 다릅니다.`);
  assert(card.sourceUrl.startsWith('https://'), `${depth}층 역사 카드 출처는 HTTPS여야 합니다.`);
}

for (const encounter of EXPEDITION_ENCOUNTERS) {
  const region = EXPEDITION_REGIONS.find(({ id }) => id === encounter.regionId);
  assert(region, `${encounter.id}의 지역이 없습니다.`);
  assert(encounter.depthMin >= region.depthMin && encounter.depthMax <= region.depthMax, `${encounter.id}의 깊이가 지역 범위를 벗어납니다.`);
  assert(['enemy', 'npc', 'event'].includes(encounter.type), `${encounter.id}의 조우 유형이 잘못되었습니다.`);
}

for (let seed = 1; seed <= 100; seed += 1) {
  const first = createExpeditionRun({ runId: `first-${seed}`, weaponTier: 1, weaponName: 'K2 소총', seed });
  assert.equal(first.encounter.type, 'enemy', '첫 조우는 항상 전투여야 합니다.');
  const final = selectExpeditionEncounter({ depth: 7, rngState: seed });
  assert.equal(final.encounter.id, 'primeval-time-shadow', '7층은 완결 적이어야 합니다.');
}

const deterministicA = selectExpeditionEncounter({ depth: 4, rngState: 20260711 });
const deterministicB = selectExpeditionEncounter({ depth: 4, rngState: 20260711 });
assert.deepEqual(deterministicA, deterministicB, '같은 난수 상태에서 조우가 재현되지 않습니다.');

const avoidRecentEnemy = selectExpeditionEncounter({
  depth: 4,
  rngState: 99,
  recentEncounterIds: ['garrison-tiger-echo'],
  random: 0,
});
assert.equal(avoidRecentEnemy.encounter.type, 'enemy', '개별 반복 방지가 조우 유형을 바꾸면 안 됩니다.');
assert.notEqual(avoidRecentEnemy.encounter.id, 'garrison-tiger-echo', '같은 유형에 다른 후보가 있는데 최근 적이 반복됩니다.');

const forcedSupport = selectExpeditionEncounter({
  depth: 4,
  rngState: 2026,
  enemyStreak: EXPEDITION_RULES.enemyStreakSupportAt,
  random: 0,
});
assert.notEqual(forcedSupport.encounter.type, 'enemy', '적 2연속 뒤 안전장치가 도움 조우를 보장하지 않습니다.');
assert.equal(forcedSupport.enemyStreak, 0, '도움 조우 뒤 적 연속 횟수가 초기화되지 않았습니다.');

const typeCounts = { enemy: 0, npc: 0, event: 0 };
let distributionState = 7102026;
for (let index = 0; index < 10_000; index += 1) {
  const selected = selectExpeditionEncounter({ depth: 4, rngState: distributionState });
  distributionState = selected.rngState;
  typeCounts[selected.encounter.type] += 1;
}
assert(Math.abs(typeCounts.enemy / 10_000 - 0.6) < 0.03, '적 유형 분포가 60%에서 크게 벗어납니다.');
assert(Math.abs(typeCounts.npc / 10_000 - 0.23) < 0.03, 'NPC 유형 분포가 23%에서 크게 벗어납니다.');
assert(Math.abs(typeCounts.event / 10_000 - 0.17) < 0.03, '사건 유형 분포가 17%에서 크게 벗어납니다.');

const bandage = getExpeditionSupply('travel-bandage');
const cloth = getExpeditionSupply('maintenance-cloth');
const pouch = getExpeditionSupply('safe-pouch');
const plainRun = createExpeditionRun({ runId: 'plain-stats', weaponTier: 3, weaponName: '무기', seed: 3 });
const bandageRun = createExpeditionRun({ runId: 'bandage-stats', weaponTier: 3, weaponName: '무기', seed: 3, supply: bandage });
const clothRun = createExpeditionRun({ runId: 'cloth-stats', weaponTier: 3, weaponName: '무기', seed: 3, supply: cloth });
assert.equal(bandageRun.playerMaxHp, plainRun.playerMaxHp + 15, '여행 붕대가 최대 체력을 올리지 않습니다.');
assert.equal(clothRun.playerAttack.min, plainRun.playerAttack.min + 3, '공명 손질 천이 공격력을 올리지 않습니다.');
assert.equal(bandageRun.usedSupply.id, bandage.id, '사용 준비물이 진행 저장에 남지 않습니다.');

let run = createExpeditionRun({ runId: 'return-flow', weaponTier: 3, weaponName: '선조대 장도·쌍수도', seed: 777 });
assert.equal(run.depth, 1);
assert.equal(run.playerHp, run.playerMaxHp);
run = beginEnemyCombat(run);
assert.equal(run.phase, 'player-attack', '첫 전투 행동은 플레이어 공격이어야 합니다.');
const actors = [];
let turns = 0;
let sawTelegraph = false;
while (['player-attack', 'enemy-telegraph', 'enemy-attack'].includes(run.phase)) {
  const beforePlayerHp = run.playerHp;
  const beforeEnemyHp = run.enemyHp;
  const phaseBefore = run.phase;
  run = advanceExpeditionCombat(run);
  if (phaseBefore === 'player-attack') {
    actors.push('player');
    assert(run.enemyHp <= beforeEnemyHp, '플레이어 공격이 적 HP를 줄이지 못했습니다.');
    if (run.phase === 'enemy-telegraph') {
      sawTelegraph = true;
      assert(run.queuedEnemyAction?.telegraphText, '적 공격 예고가 저장되지 않았습니다.');
    }
  } else if (phaseBefore === 'enemy-telegraph') {
    actors.push('enemy');
    assert(run.playerHp < beforePlayerHp || run.phase === 'defeat', '예고된 적 공격이 피해를 주지 않았습니다.');
  }
  assert(run.playerHp >= 0 && run.playerHp <= run.playerMaxHp, '플레이어 HP가 범위를 벗어났습니다.');
  assert(run.enemyHp >= 0 && run.enemyHp <= run.enemyMaxHp, '적 HP가 범위를 벗어났습니다.');
  turns += 1;
  assert(turns < 50, '전투가 종료되지 않습니다.');
}
assert(sawTelegraph, '적이 살아 있는데 공격 예고 단계가 한 번도 나오지 않았습니다.');
assert.equal(run.phase, 'victory');
assert.equal(run.lastAction.actor, 'player', '적을 쓰러뜨린 뒤 적이 반격했습니다.');
assert(sumLoot(run.pendingLoot) > 0, '적 처치 전리품이 임시 가방에 들어오지 않았습니다.');
const lootAfterVictory = run.pendingLoot;
assert.deepEqual(advanceExpeditionCombat(run).pendingLoot, lootAfterVictory, '승리 뒤 전리품이 중복 지급되었습니다.');
assert(run.seenHistoryCardIds.includes(run.encounter.historyCardId), '전투에서 확인한 역사 카드가 기록되지 않았습니다.');

run = finishVictoryScene(run);
assert.equal(run.phase, 'decision');
const resumed = sanitizeExpeditionRun(JSON.parse(JSON.stringify(run)));
assert(resumed, '저장된 진행 중 탐사를 복구하지 못했습니다.');
assert.deepEqual(continueExpedition(resumed), continueExpedition(run), '저장·재개 뒤 다음 조우가 달라집니다.');

const v2Snapshot = {
  ...JSON.parse(JSON.stringify(run)),
  version: 2,
  pendingLoot: undefined,
  activeEffects: undefined,
  recentEncounterTypes: undefined,
};
const migratedV2 = sanitizeExpeditionRun(v2Snapshot);
assert.equal(migratedV2?.version, 3, '버전 2 진행을 버전 3으로 명시적으로 이관하지 못했습니다.');
assert.deepEqual(migratedV2.pendingLoot, {}, '버전 2 진행의 전리품 기본값이 비어 있지 않습니다.');
assert.equal(sanitizeExpeditionRun({ ...run, version: 999 }), null, '지원하지 않는 미래 진행 버전을 받아들였습니다.');
assert.equal(sanitizeExpeditionRun({ ...run, depth: 7 }), null, '현재 깊이와 맞지 않는 조우를 받아들였습니다.');
assert.equal(
  sanitizeExpeditionRun({ ...run, phase: 'decision', enemyHp: 1 }),
  null,
  '살아 있는 적을 둔 결정 상태를 받아들였습니다.',
);
assert.equal(
  sanitizeExpeditionRun({ ...run, phase: 'returned', settled: true, settlement: null }),
  null,
  '정산 정보가 손상된 최종 탐사를 받아들였습니다.',
);

const npcSelection = selectExpeditionEncounter({ depth: 2, rngState: 1, random: 0.65 });
assert.equal(npcSelection.encounter.type, 'npc', '유형 가중치 구간에서 NPC를 선택할 수 없습니다.');
let npcRun = {
  ...run,
  phase: 'npc-intro',
  depth: 2,
  playerHp: run.playerMaxHp - 30,
  encounter: npcSelection.encounter,
  enemyHp: 0,
  enemyMaxHp: 0,
  lastDrop: {},
};
npcRun = resolveNpcEncounter(npcRun);
assert.equal(npcRun.phase, 'decision');
assert(npcRun.playerHp > run.playerMaxHp - 30 && npcRun.playerHp <= npcRun.playerMaxHp, 'NPC 회복이 잘못되었습니다.');
assert.equal(npcRun.npcsMet, run.npcsMet + 1);
assert(sumLoot(npcRun.lastDrop) > 0, 'NPC 조우의 가상 전리품이 없습니다.');
assert(npcRun.activeEffects.lootBonus > 0, '훈장의 다음 전리품 도움 효과가 없습니다.');
assert.deepEqual(resolveNpcEncounter(npcRun), npcRun, 'NPC 도움 효과가 두 번 적용되었습니다.');

const eventSelection = selectExpeditionEncounter({ depth: 2, rngState: 1, random: 0.9 });
assert.equal(eventSelection.encounter.type, 'event', '유형 가중치 구간에서 사건을 선택할 수 없습니다.');
let eventRun = {
  ...run,
  phase: 'event-intro',
  depth: 2,
  encounter: eventSelection.encounter,
  enemyHp: 0,
  enemyMaxHp: 0,
  lastDrop: {},
};
eventRun = resolveEventEncounter(eventRun);
assert.equal(eventRun.phase, 'decision');
assert.equal(eventRun.eventsFound, run.eventsFound + 1);
assert(eventRun.activeEffects.nextGuardBonus > 0, '손질 도구함의 다음 방어 효과가 없습니다.');

const returned = settleExpeditionReturn(npcRun);
assert.deepEqual(returned.settlement.bankedLoot, npcRun.pendingLoot, '안전 귀환 전리품이 정산되지 않았습니다.');
assert.deepEqual(returned.settlement.lostLoot, {}, '안전 귀환에서 전리품을 잃었습니다.');
let stats = applyExpeditionSettlement(EXPEDITION_STATS_INITIAL, returned);
assert.equal(stats.safeReturns, 1);
assert(stats.seenHistoryCardIds.includes(npcRun.encounter.historyCardId), '귀환 뒤 역사 발견 기록이 사라졌습니다.');
assert.deepEqual(applyExpeditionSettlement(stats, returned), stats, '안전 귀환 보상이 중복 정산됩니다.');

const cardId = npcRun.encounter.historyCardId;
stats = sanitizeExpeditionStats({ ...stats, historyFragments: 1 });
const unlocked = unlockExpeditionHistoryCard(stats, cardId);
assert.equal(unlocked.result, 'unlocked');
assert(unlocked.stats.unlockedHistoryCardIds.includes(cardId));
assert.equal(unlocked.stats.historyFragments, 0, '기록 카드 복원 비용이 차감되지 않았습니다.');
assert.equal(unlockExpeditionHistoryCard(unlocked.stats, cardId).result, 'already-unlocked');

let defeated = createExpeditionRun({ runId: 'defeat-flow', weaponTier: 1, weaponName: 'K2 소총', seed: 41 });
defeated = beginEnemyCombat(defeated);
defeated = {
  ...defeated,
  phase: 'enemy-telegraph',
  playerHp: 1,
  pendingRenown: 25,
  pendingHistoryFragments: 2,
  pendingLoot: { 'mist-fiber': 2 },
  queuedEnemyAction: {
    turn: 1,
    attackName: '검증 공격',
    telegraphText: '검증 공격을 준비한다.',
    rawDamage: 999,
    multiplier: 100,
    power: false,
  },
};
defeated = advanceExpeditionCombat(defeated);
assert.equal(defeated.phase, 'defeat');
const damaged = settleExpeditionDefeat(defeated, { gold: 120, referenceCost: 20, random: 0 });
assert.equal(damaged.settlement.penaltyType, 'weapon-damaged');
assert(damaged.settlement.goldLost <= 120, '수리비가 현재 소지금을 넘었습니다.');
assert.deepEqual(damaged.settlement.lostLoot, { 'mist-fiber': 2 }, '패배한 임시 전리품이 손실로 기록되지 않았습니다.');
assert.equal(damaged.weaponTier, 1, '탐사 사망으로 강화 단계가 변했습니다.');
stats = applyExpeditionSettlement(stats, damaged);
assert.equal(stats.deaths, 1);

const plainPenalty = settleExpeditionDefeat({ ...defeated, runId: 'plain-loss', settled: false }, {
  gold: 2_000,
  referenceCost: 550,
  random: 0.999999,
});
const protectedPenalty = settleExpeditionDefeat({
  ...defeated,
  runId: 'protected-loss',
  settled: false,
  usedSupply: pouch,
  goldLossMultiplier: pouch.goldLossMultiplier,
}, {
  gold: 2_000,
  referenceCost: 550,
  random: 0.999999,
});
assert.equal(plainPenalty.settlement.penaltyType, 'robbed');
assert.equal(protectedPenalty.settlement.goldLost, Math.round(plainPenalty.settlement.goldLost * 0.5), '안전 주머니가 엽전 손실을 절반으로 줄이지 않습니다.');
assert(plainPenalty.settlement.goldLost <= EXPEDITION_RULES.deathCoinLossCap, '강탈 손실 상한을 넘었습니다.');

let completionRun = createExpeditionRun({ runId: 'completion', weaponTier: 7, weaponName: '비파형동검', seed: 7 });
completionRun = { ...completionRun, phase: 'decision', depth: 7, enemyHp: 0, enemyMaxHp: completionRun.enemyMaxHp };
const completed = settleExpeditionReturn(completionRun);
assert.equal(completed.settlement.completionUnlocked, true, '+7 무기의 7층 귀환이 완결 기록을 열지 못했습니다.');
assert.equal(applyExpeditionSettlement(stats, completed).completionUnlocked, true);

const corrupted = sanitizeExpeditionRun({ version: 3, runId: 'bad', encounter: { id: 'unknown' } });
assert.equal(corrupted, null, '알 수 없는 조우가 있는 진행을 복구했습니다.');
const sanitized = sanitizeExpeditionStats({
  deaths: -4,
  renown: '35.9',
  seenHistoryCardIds: ['bad', EXPEDITION_HISTORY_LAYERS[0].id],
  unlockedHistoryCardIds: ['bad', EXPEDITION_HISTORY_LAYERS[0].id],
});
assert.equal(sanitized.deaths, 0);
assert.equal(sanitized.renown, 35);
assert.deepEqual(sanitized.seenHistoryCardIds, [EXPEDITION_HISTORY_LAYERS[0].id]);

console.log(
  `연속 탐사 1.1 검증 통과 · 유형 우선 조우 60/23/17 · 지역 ${EXPEDITION_REGIONS.length} · 적 ${EXPEDITION_ENEMIES.length} · NPC ${EXPEDITION_NPCS.length} · 사건 ${EXPEDITION_EVENTS.length} · 역사층 ${EXPEDITION_HISTORY_LAYERS.length}`,
);
