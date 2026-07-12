const ECONOMY_VERSION = 1;
const DEFAULT_RNG_STATE = 0x6D2B79F5;
const MAX_TRANSACTIONS = 30;

const freezeLootItem = item => Object.freeze({
  category: 'barter-material',
  fictional: true,
  ...item,
});

export const EXPEDITION_LOOT_ITEMS = Object.freeze([
  freezeLootItem({
    id: 'mist-fiber',
    name: '안개실 뭉치',
    icon: '🧶',
    description: '시간 안개가 실처럼 엉긴 게임 속 가상 재료다.',
    usage: '여행 붕대를 만드는 데 쓴다.',
  }),
  freezeLootItem({
    id: 'time-leather-scrap',
    name: '시간가죽 조각',
    icon: '🪡',
    description: '시간 틈이 얇은 막처럼 굳은 게임 속 가상 재료다.',
    usage: '안전 주머니의 겉감을 만드는 데 쓴다.',
  }),
  freezeLootItem({
    id: 'echo-metal-flake',
    name: '메아리 쇳조각',
    icon: '✨',
    description: '망치 소리를 머금고 반짝이는 게임 속 가상 쇳조각이다.',
    usage: '손질 천에 무기 공명을 더하는 데 쓴다.',
  }),
  freezeLootItem({
    id: 'record-light-drop',
    name: '기록빛 방울',
    icon: '💧',
    description: '사라진 기록의 빛이 물방울처럼 맺힌 게임 속 가상 재료다.',
    usage: '손질 천에 안정된 시간 무늬를 새기는 데 쓴다.',
  }),
  freezeLootItem({
    id: 'bronze-light-grain',
    name: '청동빛 알갱이',
    icon: '🟤',
    description: '청동색 시간 안개가 알갱이로 굳은 게임 속 가상 재료다.',
    usage: '안전 주머니가 엽전을 지키도록 힘을 보탠다.',
  }),
  freezeLootItem({
    id: 'sealed-rift-bead',
    name: '봉인된 균열 구슬',
    icon: '🔵',
    description: '닫힌 시간 균열의 빛이 구슬로 남은 게임 속 가상 재료다.',
    usage: '안전 주머니의 매듭을 완성하는 데 쓴다.',
  }),
]);

const lootEntry = (itemId, weight, min = 1, max = min) => Object.freeze({ itemId, weight, min, max });
const lootTable = (id, rolls, entries) => Object.freeze({ id, rolls, entries: Object.freeze(entries) });

export const EXPEDITION_LOOT_TABLES = Object.freeze([
  lootTable('road-enemy', 1, [
    lootEntry('time-leather-scrap', 55),
    lootEntry('mist-fiber', 45),
  ]),
  lootTable('garrison-enemy', 1, [
    lootEntry('echo-metal-flake', 60),
    lootEntry('record-light-drop', 40),
  ]),
  lootTable('bronze-enemy', 1, [
    lootEntry('bronze-light-grain', 65),
    lootEntry('echo-metal-flake', 35),
  ]),
  lootTable('final-enemy', 2, [
    lootEntry('sealed-rift-bead', 45),
    lootEntry('bronze-light-grain', 55, 1, 2),
  ]),
  lootTable('road-support', 1, [
    lootEntry('mist-fiber', 75),
    lootEntry('time-leather-scrap', 25),
  ]),
  lootTable('garrison-support', 1, [
    lootEntry('record-light-drop', 70),
    lootEntry('echo-metal-flake', 30),
  ]),
  lootTable('bronze-support', 1, [
    lootEntry('bronze-light-grain', 75),
    lootEntry('record-light-drop', 25),
  ]),
]);

const freezeSupply = supply => Object.freeze({
  ...supply,
  stackLimit: 9,
  cost: Object.freeze({
    gold: supply.cost.gold,
    loot: Object.freeze({ ...supply.cost.loot }),
  }),
});

export const EXPEDITION_SUPPLIES = Object.freeze([
  freezeSupply({
    id: 'travel-bandage',
    name: '여행 붕대',
    icon: '🩹',
    maxHpBonus: 15,
    effectDescription: '다음 탐사의 최대 체력 +15',
    cost: { gold: 120, loot: { 'mist-fiber': 2 } },
  }),
  freezeSupply({
    id: 'maintenance-cloth',
    name: '공명 손질 천',
    icon: '🧽',
    attackBonus: 3,
    effectDescription: '다음 탐사의 최소·최대 공격력 +3',
    cost: { gold: 180, loot: { 'echo-metal-flake': 2, 'record-light-drop': 1 } },
  }),
  freezeSupply({
    id: 'safe-pouch',
    name: '균열 안전 주머니',
    icon: '👝',
    goldLossMultiplier: 0.5,
    effectDescription: '다음 탐사 패배 시 엽전 손실 50% 감소',
    cost: {
      gold: 280,
      loot: { 'time-leather-scrap': 2, 'bronze-light-grain': 2, 'sealed-rift-bead': 1 },
    },
  }),
]);

const LOOT_BY_ID = new Map(EXPEDITION_LOOT_ITEMS.map(item => [item.id, item]));
const TABLE_BY_ID = new Map(EXPEDITION_LOOT_TABLES.map(table => [table.id, table]));
const SUPPLY_BY_ID = new Map(EXPEDITION_SUPPLIES.map(supply => [supply.id, supply]));

export const getExpeditionLootItem = itemId => LOOT_BY_ID.get(itemId) || null;
export const getExpeditionLootTable = tableId => TABLE_BY_ID.get(tableId) || null;
export const getExpeditionSupply = supplyId => SUPPLY_BY_ID.get(supplyId) || null;

export const EXPEDITION_ECONOMY_INITIAL = Object.freeze({
  version: ECONOMY_VERSION,
  lootInventory: Object.freeze({}),
  lootDiscovered: Object.freeze({}),
  supplies: Object.freeze({}),
  equippedSupplyId: null,
  totalLootBanked: 0,
  totalLootLost: 0,
  suppliesPurchased: 0,
  suppliesUsed: 0,
  lastLootSettlementId: '',
  appliedTransactionIds: Object.freeze([]),
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const safeInteger = (value, fallback = 0, min = 0, max = 999_999_999) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(Math.trunc(parsed), min, max) : fallback;
};
const safeText = (value, maxLength = 120) => typeof value === 'string' ? value.slice(0, maxLength) : '';
const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const sanitizeCountRecord = (value, knownIds) => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([id]) => knownIds.has(id))
      .map(([id, count]) => [id, safeInteger(count, 0, 0, 999_999)])
      .filter(([, count]) => count > 0),
  );
};

const sanitizeLootRecord = value => sanitizeCountRecord(value, LOOT_BY_ID);
const sanitizeSupplyRecord = value => sanitizeCountRecord(value, SUPPLY_BY_ID);
const countRecord = value => Object.values(value).reduce((sum, count) => sum + count, 0);

const sanitizeTransactionIds = value => {
  if (!Array.isArray(value)) return [];
  const unique = [];
  for (const rawId of value) {
    const id = safeText(rawId);
    if (!id || unique.includes(id)) continue;
    unique.push(id);
  }
  return unique.slice(-MAX_TRANSACTIONS);
};

const appendTransactionId = (ids, transactionId) => {
  const id = safeText(transactionId);
  if (!id) return sanitizeTransactionIds(ids);
  return sanitizeTransactionIds([...ids.filter(current => current !== id), id]);
};

export const sanitizeExpeditionEconomy = value => {
  const source = isRecord(value) ? value : {};
  const lootInventory = sanitizeLootRecord(source.lootInventory);
  const lootDiscovered = sanitizeLootRecord(source.lootDiscovered);
  const supplies = sanitizeSupplyRecord(source.supplies);
  const equippedCandidate = safeText(source.equippedSupplyId);
  const equippedSupplyId = SUPPLY_BY_ID.has(equippedCandidate) && (supplies[equippedCandidate] || 0) > 0
    ? equippedCandidate
    : null;

  return {
    version: ECONOMY_VERSION,
    lootInventory,
    lootDiscovered,
    supplies,
    equippedSupplyId,
    totalLootBanked: safeInteger(source.totalLootBanked),
    totalLootLost: safeInteger(source.totalLootLost),
    suppliesPurchased: safeInteger(source.suppliesPurchased),
    suppliesUsed: safeInteger(source.suppliesUsed),
    lastLootSettlementId: safeText(source.lastLootSettlementId),
    appliedTransactionIds: sanitizeTransactionIds(source.appliedTransactionIds),
  };
};

export const mergeLootRecords = (...records) => {
  const sources = records.length === 1 && Array.isArray(records[0]) ? records[0] : records;
  const merged = {};
  for (const source of sources) {
    const sanitized = sanitizeLootRecord(source);
    for (const [itemId, count] of Object.entries(sanitized)) {
      merged[itemId] = safeInteger((merged[itemId] || 0) + count, 0, 0, 999_999);
    }
  }
  return sanitizeLootRecord(merged);
};

const normalizeRngState = value => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_RNG_STATE;
  const normalized = Math.trunc(parsed) >>> 0;
  return normalized || DEFAULT_RNG_STATE;
};

const nextSeededRoll = state => {
  const rngState = (normalizeRngState(state) + 0x6D2B79F5) >>> 0 || DEFAULT_RNG_STATE;
  let value = rngState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return { rngState, roll: ((value ^ (value >>> 14)) >>> 0) / 4294967296 };
};

const takeRoll = (rngState, random) => {
  const seeded = nextSeededRoll(rngState);
  if (random === undefined) return seeded;
  const override = Number(typeof random === 'function' ? random() : random);
  return {
    rngState: seeded.rngState,
    roll: Number.isFinite(override) ? clamp(override, 0, 0.999999999) : 0.5,
  };
};

const weightedPick = (entries, roll) => {
  const totalWeight = entries.reduce((sum, entry) => sum + Math.max(1, Number(entry.weight) || 1), 0);
  let cursor = roll * totalWeight;
  for (const entry of entries) {
    cursor -= Math.max(1, Number(entry.weight) || 1);
    if (cursor < 0) return entry;
  }
  return entries[entries.length - 1];
};

export const rollExpeditionLoot = ({ tableId, rngState, bonusRolls = 0, random } = {}) => {
  const table = getExpeditionLootTable(tableId);
  let nextState = normalizeRngState(rngState);
  if (!table) return { loot: {}, rngState: nextState, items: [] };

  const loot = {};
  const rolls = table.rolls + safeInteger(bonusRolls, 0, 0, 10);
  for (let index = 0; index < rolls; index += 1) {
    const selectionRoll = takeRoll(nextState, random);
    nextState = selectionRoll.rngState;
    const entry = weightedPick(table.entries, selectionRoll.roll);
    let count = entry.min;
    if (entry.max > entry.min) {
      const countRoll = takeRoll(nextState, random);
      nextState = countRoll.rngState;
      count = entry.min + Math.floor(countRoll.roll * (entry.max - entry.min + 1));
    }
    loot[entry.itemId] = (loot[entry.itemId] || 0) + count;
  }

  const sanitizedLoot = sanitizeLootRecord(loot);
  const items = EXPEDITION_LOOT_ITEMS
    .filter(item => sanitizedLoot[item.id])
    .map(item => ({ ...item, count: sanitizedLoot[item.id] }));
  return { loot: sanitizedLoot, rngState: nextState, items };
};

export const applyExpeditionLootSettlement = (economy, run) => {
  const current = sanitizeExpeditionEconomy(economy);
  const settlement = isRecord(run?.settlement) ? run.settlement : null;
  const settlementId = safeText(settlement?.id, 100);
  const transactionId = settlementId ? safeText(`loot-settlement:${settlementId}`) : '';
  if (
    run?.settled !== true
    || !settlementId
    || current.lastLootSettlementId === settlementId
    || current.appliedTransactionIds.includes(transactionId)
  ) return current;

  const bankedLoot = sanitizeLootRecord(settlement.bankedLoot);
  const lostLoot = sanitizeLootRecord(settlement.lostLoot);
  return sanitizeExpeditionEconomy({
    ...current,
    lootInventory: mergeLootRecords(current.lootInventory, bankedLoot),
    lootDiscovered: mergeLootRecords(current.lootDiscovered, bankedLoot, lostLoot),
    totalLootBanked: current.totalLootBanked + countRecord(bankedLoot),
    totalLootLost: current.totalLootLost + countRecord(lostLoot),
    lastLootSettlementId: settlementId,
    appliedTransactionIds: appendTransactionId(current.appliedTransactionIds, transactionId),
  });
};

export const purchaseExpeditionSupply = (economy, { supplyId, gold, transactionId } = {}) => {
  const current = sanitizeExpeditionEconomy(economy);
  const currentGold = safeInteger(gold);
  const supply = getExpeditionSupply(supplyId);
  const safeTransactionId = safeText(transactionId);
  if (!supply) return { economy: current, gold: currentGold, supply: null, result: 'missing-supply' };
  if (!safeTransactionId) return { economy: current, gold: currentGold, supply, result: 'invalid-transaction' };
  if (current.appliedTransactionIds.includes(safeTransactionId)) {
    return { economy: current, gold: currentGold, supply, result: 'duplicate-transaction' };
  }
  if ((current.supplies[supply.id] || 0) >= supply.stackLimit) {
    return { economy: current, gold: currentGold, supply, result: 'stack-full' };
  }
  if (currentGold < supply.cost.gold) {
    return { economy: current, gold: currentGold, supply, result: 'insufficient-gold' };
  }
  const lacksLoot = Object.entries(supply.cost.loot)
    .some(([itemId, count]) => (current.lootInventory[itemId] || 0) < count);
  if (lacksLoot) return { economy: current, gold: currentGold, supply, result: 'insufficient-loot' };

  const lootInventory = { ...current.lootInventory };
  for (const [itemId, count] of Object.entries(supply.cost.loot)) {
    lootInventory[itemId] = (lootInventory[itemId] || 0) - count;
    if (lootInventory[itemId] <= 0) delete lootInventory[itemId];
  }
  const nextEconomy = sanitizeExpeditionEconomy({
    ...current,
    lootInventory,
    supplies: {
      ...current.supplies,
      [supply.id]: (current.supplies[supply.id] || 0) + 1,
    },
    suppliesPurchased: current.suppliesPurchased + 1,
    appliedTransactionIds: appendTransactionId(current.appliedTransactionIds, safeTransactionId),
  });
  return {
    economy: nextEconomy,
    gold: currentGold - supply.cost.gold,
    supply,
    result: 'purchased',
  };
};

export const equipExpeditionSupply = (economy, options = {}) => {
  const current = sanitizeExpeditionEconomy(economy);
  const supplyId = typeof options === 'string' ? options : options?.supplyId;
  const supply = getExpeditionSupply(supplyId);
  if (!supply) return { economy: current, supply: null, result: 'missing-supply' };
  if ((current.supplies[supply.id] || 0) <= 0) {
    return { economy: current, supply, result: 'not-owned' };
  }
  if (current.equippedSupplyId === supply.id) {
    return { economy: current, supply, result: 'already-equipped' };
  }
  return {
    economy: sanitizeExpeditionEconomy({ ...current, equippedSupplyId: supply.id }),
    supply,
    result: 'equipped',
  };
};

export const consumeEquippedExpeditionSupply = (economy, { transactionId } = {}) => {
  const current = sanitizeExpeditionEconomy(economy);
  const safeTransactionId = safeText(transactionId);
  const supply = getExpeditionSupply(current.equippedSupplyId);
  if (!safeTransactionId) return { economy: current, supply, result: 'invalid-transaction' };
  if (current.appliedTransactionIds.includes(safeTransactionId)) {
    return { economy: current, supply: null, result: 'duplicate-transaction' };
  }
  if (!supply || (current.supplies[supply.id] || 0) <= 0) {
    return { economy: current, supply: null, result: 'no-equipped-supply' };
  }

  const supplies = { ...current.supplies, [supply.id]: current.supplies[supply.id] - 1 };
  if (supplies[supply.id] <= 0) delete supplies[supply.id];
  return {
    economy: sanitizeExpeditionEconomy({
      ...current,
      supplies,
      equippedSupplyId: null,
      suppliesUsed: current.suppliesUsed + 1,
      appliedTransactionIds: appendTransactionId(current.appliedTransactionIds, safeTransactionId),
    }),
    supply,
    result: 'consumed',
  };
};
