import assert from 'node:assert/strict';

import {
  EXPEDITION_ECONOMY_INITIAL,
  EXPEDITION_LOOT_ITEMS,
  EXPEDITION_LOOT_TABLES,
  EXPEDITION_SUPPLIES,
  applyExpeditionLootSettlement,
  consumeEquippedExpeditionSupply,
  equipExpeditionSupply,
  getExpeditionLootItem,
  getExpeditionLootTable,
  getExpeditionSupply,
  mergeLootRecords,
  purchaseExpeditionSupply,
  rollExpeditionLoot,
  sanitizeExpeditionEconomy,
} from '../src/data/expeditionEconomy.js';

const expectedTableIds = new Set([
  'road-enemy',
  'garrison-enemy',
  'bronze-enemy',
  'final-enemy',
  'road-support',
  'garrison-support',
  'bronze-support',
]);

assert.equal(EXPEDITION_LOOT_ITEMS.length, 6, '탐사 교환 재료는 6종이어야 합니다.');
assert.equal(new Set(EXPEDITION_LOOT_ITEMS.map(item => item.id)).size, 6, '탐사 교환 재료 ID가 중복되었습니다.');
for (const item of EXPEDITION_LOOT_ITEMS) {
  assert.equal(item.fictional, true, `${item.id}는 게임 속 가상 재료로 표시되어야 합니다.`);
  assert.equal(item.category, 'barter-material', `${item.id}는 교환 재료여야 합니다.`);
  assert(!Object.hasOwn(item, 'sellPrice'), `${item.id}에 판매 가격을 두면 퀴즈 주 수입 원칙이 깨집니다.`);
  assert(item.name && item.description && item.usage, `${item.id}의 표시 정보가 불완전합니다.`);
  assert.equal(getExpeditionLootItem(item.id), item, `${item.id} 조회 결과가 다릅니다.`);
}

assert.deepEqual(
  new Set(EXPEDITION_LOOT_TABLES.map(table => table.id)),
  expectedTableIds,
  '필수 탐사 전리품 표가 정확히 준비되지 않았습니다.',
);
for (const table of EXPEDITION_LOOT_TABLES) {
  assert.equal(getExpeditionLootTable(table.id), table, `${table.id} 조회 결과가 다릅니다.`);
  assert(Number.isInteger(table.rolls) && table.rolls > 0, `${table.id}의 기본 추첨 횟수가 잘못되었습니다.`);
  assert(table.entries.length > 0, `${table.id}의 후보가 비어 있습니다.`);
  for (const entry of table.entries) {
    assert(getExpeditionLootItem(entry.itemId), `${table.id}가 알 수 없는 재료 ${entry.itemId}를 참조합니다.`);
    assert(entry.weight > 0, `${table.id}/${entry.itemId}의 가중치는 양수여야 합니다.`);
    assert(entry.min > 0 && entry.max >= entry.min, `${table.id}/${entry.itemId}의 수량 범위가 잘못되었습니다.`);
  }
}

assert.equal(EXPEDITION_SUPPLIES.length, 3, '다음 탐사 준비물은 3종이어야 합니다.');
assert.equal(getExpeditionSupply('travel-bandage').maxHpBonus, 15, '여행 붕대 최대 체력 보너스가 다릅니다.');
assert.equal(getExpeditionSupply('maintenance-cloth').attackBonus, 3, '공명 손질 천 공격 보너스가 다릅니다.');
assert.equal(getExpeditionSupply('safe-pouch').goldLossMultiplier, 0.5, '안전 주머니 손실 배율이 다릅니다.');
for (const supply of EXPEDITION_SUPPLIES) {
  assert(supply.cost.gold > 0, `${supply.id}의 엽전 비용이 필요합니다.`);
  assert(Object.keys(supply.cost.loot).length > 0, `${supply.id}의 전리품 비용이 필요합니다.`);
  assert(!Object.hasOwn(supply, 'sellPrice'), `${supply.id}는 되팔 수 없어야 합니다.`);
  for (const [itemId, count] of Object.entries(supply.cost.loot)) {
    assert(getExpeditionLootItem(itemId), `${supply.id}가 알 수 없는 재료를 요구합니다.`);
    assert(Number.isInteger(count) && count > 0, `${supply.id}/${itemId}의 비용 수량이 잘못되었습니다.`);
  }
}

const manyTransactionIds = Array.from({ length: 35 }, (_, index) => `transaction-${index}`);
const sanitized = sanitizeExpeditionEconomy({
  version: 999,
  lootInventory: { 'mist-fiber': 3.9, unknown: 10, 'echo-metal-flake': -2 },
  lootDiscovered: { 'mist-fiber': 5, unknown: 4 },
  supplies: { 'travel-bandage': 2.8, unknown: 8 },
  equippedSupplyId: 'unknown',
  totalLootBanked: -4,
  appliedTransactionIds: [...manyTransactionIds, 'transaction-34'],
});
assert.equal(sanitized.version, 1, '경제 상태 버전이 1로 정규화되지 않았습니다.');
assert.deepEqual(sanitized.lootInventory, { 'mist-fiber': 3 }, '전리품 수량 정리가 잘못되었습니다.');
assert.deepEqual(sanitized.lootDiscovered, { 'mist-fiber': 5 }, '발견 수량 정리가 잘못되었습니다.');
assert.deepEqual(sanitized.supplies, { 'travel-bandage': 2 }, '준비물 수량 정리가 잘못되었습니다.');
assert.equal(sanitized.equippedSupplyId, null, '보유하지 않은 준비물이 장착되었습니다.');
assert.equal(sanitized.totalLootBanked, 0, '음수 누적 수량이 제거되지 않았습니다.');
assert.equal(sanitized.appliedTransactionIds.length, 30, '거래 ID가 최근 30개로 제한되지 않았습니다.');
assert.equal(new Set(sanitized.appliedTransactionIds).size, 30, '거래 ID 중복이 제거되지 않았습니다.');

assert.deepEqual(
  mergeLootRecords({ 'mist-fiber': 2 }, { 'mist-fiber': 3, 'echo-metal-flake': 1 }, { unknown: 99 }),
  { 'mist-fiber': 5, 'echo-metal-flake': 1 },
  '전리품 묶음을 안전하게 합치지 못했습니다.',
);

for (const table of EXPEDITION_LOOT_TABLES) {
  const first = rollExpeditionLoot({ tableId: table.id, rngState: 20260711, bonusRolls: 2 });
  const second = rollExpeditionLoot({ tableId: table.id, rngState: 20260711, bonusRolls: 2 });
  assert.deepEqual(first, second, `${table.id}의 동일 시드 결과가 달라집니다.`);
  assert.notEqual(first.rngState, 20260711, `${table.id}가 난수 상태를 전진시키지 않았습니다.`);
  assert.equal(
    Object.values(first.loot).reduce((sum, count) => sum + count, 0) >= table.rolls + 2,
    true,
    `${table.id}의 추가 추첨이 적용되지 않았습니다.`,
  );
  assert(first.items.every(item => getExpeditionLootItem(item.id) && item.count > 0), `${table.id} 결과에 알 수 없는 재료가 있습니다.`);
}

const unknownRoll = rollExpeditionLoot({ tableId: 'missing', rngState: 77 });
assert.deepEqual(unknownRoll.loot, {}, '알 수 없는 표에서 전리품이 나왔습니다.');
assert.equal(unknownRoll.rngState, 77, '알 수 없는 표가 난수 상태를 바꿨습니다.');

const settledRun = {
  settled: true,
  settlement: {
    id: 'economy-return-1',
    bankedLoot: { 'mist-fiber': 2, 'echo-metal-flake': 1 },
    lostLoot: { 'record-light-drop': 2 },
  },
};
const settledEconomy = applyExpeditionLootSettlement(EXPEDITION_ECONOMY_INITIAL, settledRun);
assert.deepEqual(settledEconomy.lootInventory, { 'mist-fiber': 2, 'echo-metal-flake': 1 }, '귀환 전리품이 창고에 들어오지 않았습니다.');
assert.deepEqual(
  settledEconomy.lootDiscovered,
  { 'mist-fiber': 2, 'echo-metal-flake': 1, 'record-light-drop': 2 },
  '잃은 전리품을 포함한 발견 기록이 남지 않았습니다.',
);
assert.equal(settledEconomy.totalLootBanked, 3, '보관 전리품 누계가 다릅니다.');
assert.equal(settledEconomy.totalLootLost, 2, '손실 전리품 누계가 다릅니다.');
assert.equal(settledEconomy.lastLootSettlementId, settledRun.settlement.id, '마지막 전리품 정산 ID가 없습니다.');
assert.deepEqual(
  applyExpeditionLootSettlement(settledEconomy, settledRun),
  settledEconomy,
  '같은 전리품 정산이 두 번 적용되었습니다.',
);

const richInventory = sanitizeExpeditionEconomy({
  lootInventory: Object.fromEntries(EXPEDITION_LOOT_ITEMS.map(item => [item.id, 20])),
  lootDiscovered: Object.fromEntries(EXPEDITION_LOOT_ITEMS.map(item => [item.id, 20])),
});
const bandage = getExpeditionSupply('travel-bandage');
const insufficientGold = purchaseExpeditionSupply(richInventory, {
  supplyId: bandage.id,
  gold: bandage.cost.gold - 1,
  transactionId: 'buy-without-gold',
});
assert.equal(insufficientGold.result, 'insufficient-gold', '엽전 부족 구매가 거부되지 않았습니다.');
assert.equal(insufficientGold.gold, bandage.cost.gold - 1, '실패한 구매가 엽전을 바꿨습니다.');
assert.deepEqual(insufficientGold.economy, richInventory, '실패한 구매가 경제 상태를 바꿨습니다.');

const insufficientLoot = purchaseExpeditionSupply(EXPEDITION_ECONOMY_INITIAL, {
  supplyId: bandage.id,
  gold: 10_000,
  transactionId: 'buy-without-loot',
});
assert.equal(insufficientLoot.result, 'insufficient-loot', '전리품 부족 구매가 거부되지 않았습니다.');

const purchase = purchaseExpeditionSupply(richInventory, {
  supplyId: bandage.id,
  gold: 1_000,
  transactionId: 'buy-bandage-1',
});
assert.equal(purchase.result, 'purchased', '준비물 구매가 완료되지 않았습니다.');
assert.equal(purchase.gold, 1_000 - bandage.cost.gold, '고정 엽전 비용이 정확히 차감되지 않았습니다.');
assert(purchase.gold >= 0, '구매 후 엽전이 음수가 되었습니다.');
assert.equal(purchase.economy.supplies[bandage.id], 1, '구매한 준비물이 창고에 없습니다.');
assert.equal(
  purchase.economy.lootInventory['mist-fiber'],
  richInventory.lootInventory['mist-fiber'] - bandage.cost.loot['mist-fiber'],
  '고정 전리품 비용이 정확히 차감되지 않았습니다.',
);
const duplicatePurchase = purchaseExpeditionSupply(purchase.economy, {
  supplyId: bandage.id,
  gold: purchase.gold,
  transactionId: 'buy-bandage-1',
});
assert.equal(duplicatePurchase.result, 'duplicate-transaction', '중복 구매 거래가 거부되지 않았습니다.');
assert.equal(duplicatePurchase.gold, purchase.gold, '중복 구매가 엽전을 다시 차감했습니다.');
assert.deepEqual(duplicatePurchase.economy, purchase.economy, '중복 구매가 경제 상태를 바꿨습니다.');

const equipped = equipExpeditionSupply(purchase.economy, { supplyId: bandage.id });
assert.equal(equipped.result, 'equipped', '보유 준비물을 장착하지 못했습니다.');
assert.equal(equipped.economy.equippedSupplyId, bandage.id, '장착 ID가 저장되지 않았습니다.');
const consumed = consumeEquippedExpeditionSupply(equipped.economy, { transactionId: 'consume-bandage-1' });
assert.equal(consumed.result, 'consumed', '장착 준비물을 소비하지 못했습니다.');
assert.equal(consumed.supply.id, bandage.id, '소비 결과에 준비물 효과 정보가 없습니다.');
assert.equal(consumed.economy.supplies[bandage.id] || 0, 0, '준비물을 정확히 한 개 소비하지 않았습니다.');
assert.equal(consumed.economy.equippedSupplyId, null, '소비한 준비물이 계속 장착되어 있습니다.');
assert.equal(consumed.economy.suppliesUsed, 1, '준비물 사용 누계가 다릅니다.');
const duplicateConsume = consumeEquippedExpeditionSupply(consumed.economy, { transactionId: 'consume-bandage-1' });
assert.equal(duplicateConsume.result, 'duplicate-transaction', '중복 소비 거래가 거부되지 않았습니다.');
assert.deepEqual(duplicateConsume.economy, consumed.economy, '중복 소비가 경제 상태를 바꿨습니다.');

console.log(
  `탐사 경제 검증 통과 · 가상 재료 ${EXPEDITION_LOOT_ITEMS.length}종 · 드롭 표 ${EXPEDITION_LOOT_TABLES.length}종 · 준비물 ${EXPEDITION_SUPPLIES.length}종 · 판매가 없음`,
);
