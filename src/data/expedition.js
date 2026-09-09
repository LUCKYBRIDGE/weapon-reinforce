import {
  EXPEDITION_ENCOUNTERS,
  EXPEDITION_ENEMIES,
  EXPEDITION_EVENTS,
  EXPEDITION_HISTORY_LAYERS,
  EXPEDITION_NPCS,
  EXPEDITION_REGIONS,
  EXPEDITION_RENOWN_RANKS,
  getExpeditionEncounterById,
  getExpeditionHistoryCardById,
  getExpeditionHistoryLayer,
  getExpeditionRegion,
  getExpeditionRenownRank,
} from './expeditionCatalog.js';
import {
  getExpeditionSupply,
  mergeLootRecords,
  rollExpeditionLoot,
} from './expeditionEconomy.js';
import { WEAPON_TIMELINE } from './weaponTimeline.js';

export {
  EXPEDITION_ENCOUNTERS,
  EXPEDITION_ENEMIES,
  EXPEDITION_EVENTS,
  EXPEDITION_HISTORY_LAYERS,
  EXPEDITION_NPCS,
  EXPEDITION_REGIONS,
  EXPEDITION_RENOWN_RANKS,
  getExpeditionHistoryCardById,
  getExpeditionHistoryLayer,
  getExpeditionRegion,
  getExpeditionRenownRank,
};

const DEFAULT_RNG_STATE = 0x6D2B79F5;
const UINT32_MAX = 0xFFFFFFFF;
const RUN_VERSION = 3;
const LEGACY_RUN_VERSION = 2;
const ENCOUNTER_TYPES = Object.freeze(['enemy', 'npc', 'event']);
const SUPPORT_EFFECT_KINDS = Object.freeze(['heal', 'nextAttackBonus', 'nextGuardBonus', 'lootBonus']);
const ACTIVE_EFFECT_KEYS = Object.freeze(['nextAttackBonus', 'nextGuardBonus', 'lootBonus']);
const EMPTY_ACTIVE_EFFECTS = Object.freeze({
  nextAttackBonus: 0,
  nextGuardBonus: 0,
  lootBonus: 0,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const safeInteger = (value, fallback = 0, min = 0, max = 999_999_999) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(Math.trunc(parsed), min, max) : fallback;
};

const safeNumber = (value, fallback = 0, min = 0, max = 999_999_999) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
};

const safeText = (value, fallback = '', maxLength = 240) => typeof value === 'string'
  ? value.slice(0, maxLength)
  : fallback;

const uniqueKnownIds = (value, knownIds, limit = 100) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(id => typeof id === 'string' && knownIds.has(id)))].slice(-limit);
};

const sanitizeLootRecord = value => mergeLootRecords(isRecord(value) ? value : {});

const countLoot = loot => Object.values(sanitizeLootRecord(loot)).reduce((sum, count) => sum + count, 0);

const readRoll = random => {
  const value = typeof random === 'function' ? random() : Number(random);
  return Number.isFinite(value) ? clamp(value, 0, 0.999999999) : 0.5;
};

const normalizeRngState = value => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_RNG_STATE;
  const normalized = Math.trunc(parsed) >>> 0;
  return normalized || DEFAULT_RNG_STATE;
};

const nextSeededRoll = state => {
  const nextState = (normalizeRngState(state) + 0x6D2B79F5) >>> 0 || DEFAULT_RNG_STATE;
  let value = nextState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return {
    rngState: nextState,
    roll: ((value ^ (value >>> 14)) >>> 0) / 4294967296,
  };
};

const takeRoll = (rngState, random) => {
  const seeded = nextSeededRoll(rngState);
  if (random === undefined) return seeded;
  return { rngState: seeded.rngState, roll: readRoll(random) };
};

const takeRange = (range, rngState, random) => {
  const min = safeInteger(range?.min, 1, 1, 9999);
  const max = safeInteger(range?.max, min, min, 9999);
  const next = takeRoll(rngState, random);
  return {
    rngState: next.rngState,
    value: min + Math.floor(next.roll * (max - min + 1)),
  };
};

const getRandomSeed = () => {
  const timeSeed = Date.now() >>> 0;
  const randomSeed = Math.floor(Math.random() * UINT32_MAX) >>> 0;
  return (timeSeed ^ randomSeed) || DEFAULT_RNG_STATE;
};

export const EXPEDITION_RULES = Object.freeze({
  version: RUN_VERSION,
  maxDepth: 7,
  recentEncounterLimit: 2,
  recentEncounterTypeLimit: 3,
  enemyStreakSupportAt: 2,
  encounterTypeWeights: Object.freeze({ enemy: 60, npc: 23, event: 17 }),
  deathCoinLossCap: 200,
  turnDelayMs: 760,
  fastTurnDelayMs: 390,
});

export const EXPEDITION_ASSET_FILES = Object.freeze([
  'expedition_player_rear.png',
  ...new Set(EXPEDITION_ENCOUNTERS.map(({ asset }) => asset)),
]);

export const EXPEDITION_STATS_INITIAL = Object.freeze({
  expeditions: 0,
  safeReturns: 0,
  deaths: 0,
  enemiesDefeated: 0,
  npcsMet: 0,
  eventsFound: 0,
  deepestDepth: 0,
  renown: 0,
  historyFragments: 0,
  historyFragmentsSpent: 0,
  renownLost: 0,
  historyFragmentsLost: 0,
  goldLost: 0,
  weaponsDamaged: 0,
  robberies: 0,
  seenHistoryCardIds: Object.freeze([]),
  unlockedHistoryCardIds: Object.freeze([]),
  completionUnlocked: false,
  lastSettlementId: '',
});

const HISTORY_CARD_IDS = new Set(EXPEDITION_HISTORY_LAYERS.map(({ id }) => id));
const ENCOUNTER_IDS = new Set(EXPEDITION_ENCOUNTERS.map(({ id }) => id));

export const sanitizeExpeditionStats = value => {
  const source = isRecord(value) ? value : {};
  const sanitizedNumbers = Object.fromEntries(
    Object.entries(EXPEDITION_STATS_INITIAL)
      .filter(([, fallback]) => typeof fallback === 'number')
      .map(([key, fallback]) => [key, safeInteger(source[key], fallback)]),
  );
  const seenHistoryCardIds = uniqueKnownIds(source.seenHistoryCardIds, HISTORY_CARD_IDS, HISTORY_CARD_IDS.size);
  const unlockedHistoryCardIds = uniqueKnownIds(source.unlockedHistoryCardIds, HISTORY_CARD_IDS, HISTORY_CARD_IDS.size)
    .filter(id => seenHistoryCardIds.includes(id));
  return {
    ...sanitizedNumbers,
    seenHistoryCardIds,
    unlockedHistoryCardIds,
    completionUnlocked: source.completionUnlocked === true,
    lastSettlementId: safeText(source.lastSettlementId, '', 120),
  };
};

export const migrateLegacyEncounterStats = legacyValue => {
  const legacy = isRecord(legacyValue) ? legacyValue : {};
  return sanitizeExpeditionStats({
    enemiesDefeated: legacy.wins,
    renown: legacy.renown,
  });
};

const sanitizeSupplySnapshot = value => {
  const source = typeof value === 'string' ? getExpeditionSupply(value) : value;
  const supply = getExpeditionSupply(source?.id);
  if (!supply) return null;
  return {
    id: supply.id,
    name: supply.name,
    icon: supply.icon,
    effectDescription: supply.effectDescription,
    maxHpBonus: safeInteger(supply.maxHpBonus, 0, 0, 999),
    attackBonus: safeInteger(supply.attackBonus, 0, 0, 99),
    goldLossMultiplier: safeNumber(supply.goldLossMultiplier, 1, 0, 1),
  };
};

export const getExpeditionPlayerStats = (weaponTier, supplyValue = null) => {
  const tier = safeInteger(weaponTier, 1, 1, 7);
  const combatProfile = WEAPON_TIMELINE[tier]?.combatProfile || WEAPON_TIMELINE[1].combatProfile;
  const supply = sanitizeSupplySnapshot(supplyValue);
  const attackBonus = supply?.attackBonus || 0;
  return {
    maxHp: 90 + tier * 10 + (supply?.maxHpBonus || 0),
    attack: {
      min: 16 + tier * 4 + attackBonus,
      max: 22 + tier * 4 + attackBonus,
    },
    combatProfile,
    supply,
    goldLossMultiplier: supply?.goldLossMultiplier ?? 1,
  };
};

const weightedPick = (pool, roll, getWeight = entry => entry.weight) => {
  const totalWeight = pool.reduce((sum, entry) => sum + Math.max(1, Number(getWeight(entry)) || 1), 0);
  let cursor = roll * totalWeight;
  for (const entry of pool) {
    cursor -= Math.max(1, Number(getWeight(entry)) || 1);
    if (cursor < 0) return entry;
  }
  return pool[pool.length - 1];
};

const sanitizeEffects = effects => {
  if (!Array.isArray(effects)) return [];
  return effects
    .filter(effect => isRecord(effect) && SUPPORT_EFFECT_KINDS.includes(effect.kind))
    .map(effect => ({
      kind: effect.kind,
      amount: safeInteger(effect.amount, 0, 0, effect.kind === 'heal' ? 999 : 99),
    }))
    .filter(effect => effect.amount > 0);
};

const sanitizeSupportChoices = choices => {
  if (!Array.isArray(choices)) return [];

  const seenIds = new Set();
  return choices
    .filter(isRecord)
    .map(choice => ({
      id: safeText(choice.id, '', 80),
      label: safeText(choice.label, '', 80),
      description: safeText(choice.description, '', 160),
      result: safeText(choice.result, '', 240),
      effects: sanitizeEffects(choice.effects),
      bonusLootRolls: safeInteger(choice.bonusLootRolls, 0, 0, 2),
    }))
    .filter(choice => {
      if (!choice.id || !choice.label || seenIds.has(choice.id)) return false;
      if (choice.effects.length === 0 && choice.bonusLootRolls <= 0) return false;
      seenIds.add(choice.id);
      return true;
    })
    .slice(0, 2);
};

const materializeEncounter = (entry, depth) => {
  const safeDepth = safeInteger(depth, 1, 1, EXPEDITION_RULES.maxDepth);
  const region = getExpeditionRegion(safeDepth);
  const historyLayer = getExpeditionHistoryLayer(safeDepth);
  const common = {
    ...entry,
    depth: safeDepth,
    region,
    historyLayer,
    historyCardId: historyLayer.id,
  };

  if (entry.type === 'enemy') {
    const combat = isRecord(entry.combat) ? entry.combat : {};
    const finalBonus = entry.final ? 24 : 0;
    const baseHp = 42 + safeDepth * 14 + finalBonus;
    const baseAttackMin = 7 + safeDepth * 3 + (entry.final ? 3 : 0);
    const hpPercent = safeInteger(combat.hpPercent, 100, 50, 250);
    const attackPercent = safeInteger(combat.attackPercent, 100, 40, 250);
    const maxHp = Math.max(1, Math.round(baseHp * hpPercent / 100));
    const attackMin = Math.max(1, Math.round(baseAttackMin * attackPercent / 100));
    return {
      ...common,
      combat: {
        armor: safeInteger(combat.armor, 0, 0, 99),
        hpPercent,
        attackPercent,
        firstAttackPercent: safeInteger(combat.firstAttackPercent, 100, 100, 300),
        powerEvery: safeInteger(combat.powerEvery, 0, 0, 20),
        powerPercent: safeInteger(combat.powerPercent, 100, 100, 300),
        actionName: safeText(combat.actionName, '반격', 80),
        telegraph: safeText(combat.telegraph, '공격 자세를 취한다.', 160),
        powerName: safeText(combat.powerName, '강한 반격', 80),
        powerTelegraph: safeText(combat.powerTelegraph, '강한 힘을 모은다.', 160),
      },
      maxHp,
      attack: { min: attackMin, max: attackMin + 5 },
      reward: {
        renown: 8 + safeDepth * 5 + (entry.final ? 8 : 0),
        historyFragments: entry.final ? 2 : safeDepth >= 2 ? 1 : 0,
      },
      victory: entry.result,
    };
  }

  const effects = sanitizeEffects(entry.effects);
  const choices = sanitizeSupportChoices(entry.choices);
  return {
    ...common,
    effects,
    choices,
    choicePrompt: choices.length === 2
      ? safeText(entry.choicePrompt, '어떤 도움을 받을지 하나를 고른다.', 180)
      : '',
    heal: effects.filter(effect => effect.kind === 'heal').reduce((sum, effect) => sum + effect.amount, 0),
    reward: {
      renown: safeInteger(entry.effect?.renown, 0, 0, 9999),
      historyFragments: safeInteger(entry.effect?.historyFragments, 0, 0, 99),
    },
  };
};

const selectEncounterType = ({ safeDepth, enemyStreak, forceEnemy, rngState, random }) => {
  if (safeDepth === 1 || forceEnemy || safeDepth === EXPEDITION_RULES.maxDepth) {
    return { type: 'enemy', rngState };
  }
  const supportOnly = safeInteger(enemyStreak, 0, 0, 99) >= EXPEDITION_RULES.enemyStreakSupportAt;
  const types = supportOnly
    ? ENCOUNTER_TYPES.filter(type => type !== 'enemy')
    : ENCOUNTER_TYPES;
  const typeRoll = takeRoll(rngState, random);
  return {
    type: weightedPick(types, typeRoll.roll, type => EXPEDITION_RULES.encounterTypeWeights[type]),
    rngState: typeRoll.rngState,
  };
};

export const selectExpeditionEncounter = ({
  depth,
  rngState,
  recentEncounterIds = [],
  recentEncounterTypes = [],
  enemyStreak = 0,
  forceEnemy = false,
  random,
} = {}) => {
  const safeDepth = safeInteger(depth, 1, 1, EXPEDITION_RULES.maxDepth);
  const region = getExpeditionRegion(safeDepth);
  const typeSelection = selectEncounterType({
    safeDepth,
    enemyStreak,
    forceEnemy,
    rngState: normalizeRngState(rngState),
    random,
  });
  let pool = EXPEDITION_ENCOUNTERS.filter(entry => (
    entry.type === typeSelection.type
    && entry.regionId === region.id
    && safeDepth >= entry.depthMin
    && safeDepth <= entry.depthMax
  ));
  if (safeDepth === EXPEDITION_RULES.maxDepth) pool = pool.filter(entry => entry.final === true);
  if (pool.length === 0) throw new Error(`${safeDepth}층 ${typeSelection.type} 조우 후보가 없습니다.`);

  const recentSet = new Set(recentEncounterIds.slice(-EXPEDITION_RULES.recentEncounterLimit));
  const freshPool = pool.filter(entry => !recentSet.has(entry.id));
  if (freshPool.length > 0) pool = freshPool;

  const candidateRoll = takeRoll(typeSelection.rngState, random);
  const selected = weightedPick(pool, candidateRoll.roll);
  const nextEnemyStreak = selected.type === 'enemy' ? safeInteger(enemyStreak, 0, 0, 99) + 1 : 0;
  return {
    encounter: materializeEncounter(selected, safeDepth),
    rngState: candidateRoll.rngState,
    recentEncounterIds: [...recentEncounterIds, selected.id].slice(-EXPEDITION_RULES.recentEncounterLimit),
    recentEncounterTypes: [...recentEncounterTypes, selected.type].slice(-EXPEDITION_RULES.recentEncounterTypeLimit),
    enemyStreak: nextEnemyStreak,
  };
};

export const createExpeditionEvent = (depth, weaponTier, options = {}) => selectExpeditionEncounter({
  depth,
  rngState: options.rngState ?? normalizeRngState(weaponTier * 7919 + depth * 104729),
  recentEncounterIds: options.recentEncounterIds,
  recentEncounterTypes: options.recentEncounterTypes,
  enemyStreak: options.enemyStreak,
  forceEnemy: options.forceEnemy,
  random: options.random,
}).encounter;

const sanitizeActiveEffects = value => {
  const source = isRecord(value) ? value : {};
  return {
    nextAttackBonus: safeInteger(source.nextAttackBonus, 0, 0, 99),
    nextGuardBonus: safeInteger(source.nextGuardBonus, 0, 0, 99),
    lootBonus: safeInteger(source.lootBonus, 0, 0, 3),
  };
};

const createLastAction = ({ id, actor = 'system', text, ...rest }) => ({
  id: safeInteger(id, 0, 0, 999_999),
  actor: ['system', 'player', 'enemy', 'npc', 'event'].includes(actor) ? actor : 'system',
  damage: safeInteger(rest.damage, 0, 0, 9999),
  critical: rest.critical === true,
  power: rest.power === true,
  telegraph: rest.telegraph === true,
  attackName: safeText(rest.attackName, '', 80),
  healed: safeInteger(rest.healed, 0, 0, 999),
  guarded: safeInteger(rest.guarded, 0, 0, 999),
  attackBonus: safeInteger(rest.attackBonus, 0, 0, 99),
  critMultiplier: safeNumber(rest.critMultiplier, 1, 1, 5),
  text: safeText(text, '', 360),
});

export const createExpeditionRun = ({ runId, weaponTier, weaponName, seed, supply = null } = {}) => {
  const tier = safeInteger(weaponTier, 1, 1, 7);
  const player = getExpeditionPlayerStats(tier, supply);
  const selected = selectExpeditionEncounter({
    depth: 1,
    rngState: normalizeRngState(seed ?? getRandomSeed()),
    recentEncounterIds: [],
    recentEncounterTypes: [],
    enemyStreak: 0,
    forceEnemy: true,
  });
  return {
    version: RUN_VERSION,
    runId: safeText(String(runId || `expedition-${Date.now()}`), 'expedition-run', 120),
    phase: 'enemy-intro',
    depth: 1,
    weaponTier: tier,
    weaponName: safeText(String(weaponName || '현재 무기'), '현재 무기', 80),
    playerHp: player.maxHp,
    playerMaxHp: player.maxHp,
    playerAttack: player.attack,
    combatProfile: player.combatProfile,
    usedSupply: player.supply,
    goldLossMultiplier: player.goldLossMultiplier,
    pendingRenown: 0,
    pendingHistoryFragments: 0,
    pendingLoot: {},
    lastDrop: {},
    enemiesDefeated: 0,
    npcsMet: 0,
    eventsFound: 0,
    seenHistoryCardIds: [selected.encounter.historyCardId],
    encounter: selected.encounter,
    enemyHp: selected.encounter.maxHp,
    enemyMaxHp: selected.encounter.maxHp,
    rngState: selected.rngState,
    recentEncounterIds: selected.recentEncounterIds,
    recentEncounterTypes: selected.recentEncounterTypes,
    enemyStreak: selected.enemyStreak,
    encounteredIds: [selected.encounter.id],
    playerTurnsTaken: 0,
    enemyTurnsTaken: 0,
    activeEffects: { ...EMPTY_ACTIVE_EFFECTS },
    queuedEnemyAction: null,
    step: 0,
    lastAction: createLastAction({ id: 0, text: selected.encounter.intro }),
    settled: false,
    settlement: null,
  };
};

export const beginEnemyCombat = run => {
  if (!run || run.settled || run.phase !== 'enemy-intro' || run.encounter?.type !== 'enemy') return run;
  return {
    ...run,
    phase: 'player-attack',
    step: run.step + 1,
    lastAction: createLastAction({
      id: run.step + 1,
      text: `${run.encounter.roleLabel} · ${run.encounter.traitDescription} ${run.weaponName}의 ${run.combatProfile.attackName} 준비를 시작한다.`,
    }),
  };
};

const queueEnemyAction = (run, rngState, random) => {
  const enemyTurn = run.enemyTurnsTaken + 1;
  const combat = run.encounter.combat;
  const firstPower = enemyTurn === 1 && combat.firstAttackPercent > 100;
  const periodicPower = combat.powerEvery > 0 && enemyTurn % combat.powerEvery === 0;
  const power = firstPower || periodicPower;
  const multiplier = power
    ? firstPower ? combat.firstAttackPercent : combat.powerPercent
    : 100;
  const damageRoll = takeRange(run.encounter.attack, rngState, random);
  const attackName = power ? combat.powerName : combat.actionName;
  const telegraphText = power ? combat.powerTelegraph : combat.telegraph;
  return {
    rngState: damageRoll.rngState,
    action: {
      turn: enemyTurn,
      attackName,
      telegraphText,
      rawDamage: Math.max(1, Math.round(damageRoll.value * multiplier / 100)),
      multiplier,
      power,
    },
  };
};

const rollEncounterLoot = (run, rngState, random) => {
  const rolled = rollExpeditionLoot({
    tableId: run.encounter.lootTableId,
    rngState,
    bonusRolls: run.activeEffects.lootBonus,
    random: random === undefined ? undefined : () => readRoll(random),
  });
  return {
    ...rolled,
    activeEffects: { ...run.activeEffects, lootBonus: 0 },
  };
};

export const advanceExpeditionCombat = (run, random) => {
  if (!run || run.settled || !['player-attack', 'enemy-telegraph', 'enemy-attack'].includes(run.phase)) return run;
  const nextStep = run.step + 1;

  if (run.phase === 'player-attack') {
    const damageRoll = takeRange(run.playerAttack, run.rngState, random);
    const criticalRoll = takeRoll(damageRoll.rngState, random);
    const isCritical = criticalRoll.roll < Number(run.combatProfile?.critChance || 0);
    const criticalMultiplier = isCritical ? Number(run.combatProfile?.critMultiplier || 1.25) : 1;
    const attackBonus = safeInteger(run.activeEffects?.nextAttackBonus, 0, 0, 99);
    const enemyArmor = safeInteger(run.encounter.combat?.armor, 0, 0, 99);
    const grossDamage = Math.round(damageRoll.value * criticalMultiplier * (1 + attackBonus / 100));
    const damage = Math.max(1, grossDamage - enemyArmor);
    const enemyHp = clamp(run.enemyHp - damage, 0, run.enemyMaxHp);
    const healOnHit = safeInteger(run.combatProfile?.healOnHit, 0, 0, 99);
    const healed = Math.min(healOnHit, run.playerMaxHp - run.playerHp);
    const playerHp = run.playerHp + healed;
    const baseEffects = { ...run.activeEffects, nextAttackBonus: 0 };
    const actionText = `${run.combatProfile.attackName}! ${run.encounter.name}에게 ${damage} 피해${enemyArmor ? ` · 적 방어 ${enemyArmor}` : ''}${attackBonus ? ` · 도움 효과 +${attackBonus}%` : ''}${isCritical ? ' · 공명 치명타' : ''}${healed ? ` · 체력 ${healed} 회복` : ''}`;

    if (enemyHp <= 0) {
      const lootResult = rollEncounterLoot({ ...run, activeEffects: baseEffects }, criticalRoll.rngState, random);
      return {
        ...run,
        phase: 'victory',
        playerHp,
        enemyHp,
        rngState: lootResult.rngState,
        step: nextStep,
        pendingRenown: run.pendingRenown + run.encounter.reward.renown,
        pendingHistoryFragments: run.pendingHistoryFragments + run.encounter.reward.historyFragments,
        pendingLoot: mergeLootRecords(run.pendingLoot, lootResult.loot),
        lastDrop: lootResult.loot,
        enemiesDefeated: run.enemiesDefeated + 1,
        playerTurnsTaken: run.playerTurnsTaken + 1,
        activeEffects: lootResult.activeEffects,
        queuedEnemyAction: null,
        seenHistoryCardIds: [...new Set([...run.seenHistoryCardIds, run.encounter.historyCardId])],
        lastAction: createLastAction({
          id: nextStep,
          actor: 'player',
          attackName: run.combatProfile.attackName,
          damage,
          critical: isCritical,
          healed,
          attackBonus,
          critMultiplier: criticalMultiplier,
          text: `${actionText} · 전리품 ${countLoot(lootResult.loot)}개 발견`,
        }),
      };
    }

    const queued = queueEnemyAction(run, criticalRoll.rngState, random);
    return {
      ...run,
      phase: 'enemy-telegraph',
      playerHp,
      enemyHp,
      rngState: queued.rngState,
      step: nextStep,
      playerTurnsTaken: run.playerTurnsTaken + 1,
      activeEffects: baseEffects,
      queuedEnemyAction: queued.action,
      lastAction: createLastAction({
        id: nextStep,
        actor: 'player',
        attackName: run.combatProfile.attackName,
        damage,
        critical: isCritical,
        healed,
        attackBonus,
        critMultiplier: criticalMultiplier,
        text: actionText,
      }),
    };
  }

  if (run.phase === 'enemy-telegraph') {
    const queued = run.queuedEnemyAction;
    if (!queued) return { ...run, phase: 'player-attack', step: nextStep };
    const baseGuard = safeInteger(run.combatProfile?.guard, 0, 0, 99);
    const guardBonus = safeInteger(run.activeEffects?.nextGuardBonus, 0, 0, 99);
    const totalGuard = baseGuard + guardBonus;
    const rawDamage = safeInteger(queued.rawDamage, 1, 1, 9999);
    const damage = Math.max(1, rawDamage - totalGuard);
    const guarded = Math.max(0, rawDamage - damage);
    const playerHp = clamp(run.playerHp - damage, 0, run.playerMaxHp);
    return {
      ...run,
      phase: playerHp <= 0 ? 'defeat' : 'enemy-attack',
      playerHp,
      step: nextStep,
      enemyTurnsTaken: run.enemyTurnsTaken + 1,
      activeEffects: { ...run.activeEffects, nextGuardBonus: 0 },
      queuedEnemyAction: playerHp <= 0 ? null : queued,
      lastAction: createLastAction({
        id: nextStep,
        actor: 'enemy',
        attackName: queued.attackName,
        damage,
        power: queued.power,
        guarded,
        text: `${run.encounter.name}의 ${queued.attackName}! ${damage} 피해${queued.power ? ' · 강공격' : ''}${guarded ? ` · 피해 ${guarded} 경감` : ''}`,
      }),
    };
  }

  return {
    ...run,
    phase: 'player-attack',
    queuedEnemyAction: null,
    step: nextStep,
    lastAction: createLastAction({
      id: nextStep,
      text: `${run.encounter.name}의 반격을 버텼다. 다시 ${run.combatProfile.attackName} 준비를 시작한다.`,
    }),
  };
};

export const finishVictoryScene = run => {
  if (!run || run.settled || run.phase !== 'victory') return run;
  return {
    ...run,
    phase: 'decision',
    step: run.step + 1,
    lastAction: createLastAction({
      id: run.step + 1,
      text: `${run.encounter.victory} 임시 전리품을 챙겼다.`,
    }),
  };
};

const resolveSupportEncounter = (run, expectedType, choiceId = '') => {
  const introPhase = `${expectedType}-intro`;
  const choicePhase = `${expectedType}-choice`;
  if (!run || run.settled || run.encounter?.type !== expectedType) return run;

  const choices = sanitizeSupportChoices(run.encounter.choices);
  const hasChoices = choices.length === 2;
  const selectedChoice = hasChoices
    ? choices.find(choice => choice.id === safeText(choiceId, '', 80)) || null
    : null;

  if (hasChoices) {
    if (run.phase === introPhase && !selectedChoice) {
      return {
        ...run,
        phase: choicePhase,
        step: run.step + 1,
        lastAction: createLastAction({
          id: run.step + 1,
          actor: expectedType,
          text: run.encounter.choicePrompt,
        }),
      };
    }
    if (run.phase === choicePhase && !selectedChoice) return run;
    if (![introPhase, choicePhase].includes(run.phase)) return run;
  } else if (run.phase !== introPhase) {
    return run;
  }

  const effects = selectedChoice?.effects || sanitizeEffects(run.encounter.effects);
  const healAmount = effects
    .filter(effect => effect.kind === 'heal')
    .reduce((sum, effect) => sum + effect.amount, 0);
  const healed = Math.min(healAmount, run.playerMaxHp - run.playerHp);
  const activeEffects = { ...run.activeEffects };
  for (const effect of effects) {
    if (!ACTIVE_EFFECT_KEYS.includes(effect.kind)) continue;
    const max = effect.kind === 'lootBonus' ? 3 : 99;
    activeEffects[effect.kind] = clamp((activeEffects[effect.kind] || 0) + effect.amount, 0, max);
  }
  const bonusLootRolls = selectedChoice?.bonusLootRolls || 0;
  const lootResult = rollExpeditionLoot({
    tableId: run.encounter.lootTableId,
    rngState: run.rngState,
    bonusRolls: bonusLootRolls,
    random: undefined,
  });
  const effectLabels = [
    selectedChoice ? `선택: ${selectedChoice.label}` : '',
    healed ? `체력 ${healed} 회복` : '',
    effects.some(effect => effect.kind === 'nextAttackBonus') ? `다음 공격 +${activeEffects.nextAttackBonus}%` : '',
    effects.some(effect => effect.kind === 'nextGuardBonus') ? `다음 방어 +${activeEffects.nextGuardBonus}` : '',
    effects.some(effect => effect.kind === 'lootBonus') ? `다음 전리품 +${activeEffects.lootBonus}회` : '',
    bonusLootRolls ? `현장 전리품 추가 조사 ${bonusLootRolls}회` : '',
  ].filter(Boolean).join(' · ');
  const resultText = selectedChoice?.result || run.encounter.result;

  return {
    ...run,
    phase: 'decision',
    playerHp: run.playerHp + healed,
    pendingRenown: run.pendingRenown + run.encounter.reward.renown,
    pendingHistoryFragments: run.pendingHistoryFragments + run.encounter.reward.historyFragments,
    pendingLoot: mergeLootRecords(run.pendingLoot, lootResult.loot),
    lastDrop: lootResult.loot,
    rngState: lootResult.rngState,
    activeEffects,
    npcsMet: run.npcsMet + (expectedType === 'npc' ? 1 : 0),
    eventsFound: run.eventsFound + (expectedType === 'event' ? 1 : 0),
    seenHistoryCardIds: [...new Set([...run.seenHistoryCardIds, run.encounter.historyCardId])],
    step: run.step + 1,
    lastAction: createLastAction({
      id: run.step + 1,
      actor: expectedType,
      text: `${resultText} ${effectLabels || '도움 효과 없음'} · 전리품 ${countLoot(lootResult.loot)}개`,
    }),
  };
};

export const resolveNpcEncounter = (run, choiceId) => resolveSupportEncounter(run, 'npc', choiceId);
export const resolveEventEncounter = (run, choiceId) => resolveSupportEncounter(run, 'event', choiceId);

export const continueExpedition = run => {
  if (!run || run.settled || run.phase !== 'decision' || run.depth >= EXPEDITION_RULES.maxDepth) return run;
  const depth = run.depth + 1;
  const selected = selectExpeditionEncounter({
    depth,
    rngState: run.rngState,
    recentEncounterIds: run.recentEncounterIds,
    recentEncounterTypes: run.recentEncounterTypes,
    enemyStreak: run.enemyStreak,
  });
  const encounter = selected.encounter;
  return {
    ...run,
    phase: `${encounter.type}-intro`,
    depth,
    encounter,
    enemyHp: encounter.type === 'enemy' ? encounter.maxHp : 0,
    enemyMaxHp: encounter.type === 'enemy' ? encounter.maxHp : 0,
    rngState: selected.rngState,
    recentEncounterIds: selected.recentEncounterIds,
    recentEncounterTypes: selected.recentEncounterTypes,
    enemyStreak: selected.enemyStreak,
    encounteredIds: [...run.encounteredIds, encounter.id],
    seenHistoryCardIds: [...new Set([...run.seenHistoryCardIds, encounter.historyCardId])],
    lastDrop: {},
    queuedEnemyAction: null,
    step: run.step + 1,
    lastAction: createLastAction({
      id: run.step + 1,
      text: `${depth}번째 역사층으로 더 깊이 들어간다. ${encounter.intro}`,
    }),
  };
};

export const settleExpeditionReturn = run => {
  if (!run || run.settled || run.phase !== 'decision') return run;
  const completionUnlocked = run.depth >= EXPEDITION_RULES.maxDepth && run.weaponTier >= 7;
  return {
    ...run,
    phase: 'returned',
    settled: true,
    settlement: {
      id: `${run.runId}:return`,
      kind: 'return',
      bankedRenown: run.pendingRenown,
      bankedHistoryFragments: run.pendingHistoryFragments,
      bankedLoot: sanitizeLootRecord(run.pendingLoot),
      lostRenown: 0,
      lostHistoryFragments: 0,
      lostLoot: {},
      goldLost: 0,
      goldBefore: null,
      goldAfter: null,
      penaltyType: null,
      completionUnlocked,
    },
    pendingRenown: 0,
    pendingHistoryFragments: 0,
    pendingLoot: {},
  };
};

export const settleExpeditionDefeat = (run, { gold, referenceCost, random } = {}) => {
  if (!run || run.settled || run.phase !== 'defeat') return run;
  const currentGold = safeInteger(gold, 0);
  const repairCost = safeInteger(referenceCost, 20, 0, 999_999_999);
  const penaltyRoll = takeRoll(run.rngState, random);
  const penaltyType = penaltyRoll.roll < 0.55 ? 'weapon-damaged' : 'robbed';
  const rawLoss = penaltyType === 'weapon-damaged'
    ? Math.max(10, Math.round(repairCost * 0.6) + run.depth * 5)
    : Math.max(10, Math.round(currentGold * 0.08) + run.depth * 5);
  const lossMultiplier = safeNumber(run.goldLossMultiplier, 1, 0, 1);
  const protectedLoss = Math.round(rawLoss * lossMultiplier);
  const goldLost = Math.min(currentGold, EXPEDITION_RULES.deathCoinLossCap, protectedLoss);
  return {
    ...run,
    phase: 'defeated',
    settled: true,
    rngState: penaltyRoll.rngState,
    settlement: {
      id: `${run.runId}:defeat`,
      kind: 'defeat',
      bankedRenown: 0,
      bankedHistoryFragments: 0,
      bankedLoot: {},
      lostRenown: run.pendingRenown,
      lostHistoryFragments: run.pendingHistoryFragments,
      lostLoot: sanitizeLootRecord(run.pendingLoot),
      goldLost,
      goldBefore: currentGold,
      goldAfter: currentGold - goldLost,
      penaltyType,
      completionUnlocked: false,
    },
    pendingRenown: 0,
    pendingHistoryFragments: 0,
    pendingLoot: {},
  };
};

export const applyExpeditionSettlement = (stats, run) => {
  const current = sanitizeExpeditionStats(stats);
  const settlement = run?.settlement;
  if (!run?.settled || !settlement?.id || current.lastSettlementId === settlement.id) return current;
  const isReturn = settlement.kind === 'return';
  return sanitizeExpeditionStats({
    ...current,
    expeditions: current.expeditions + 1,
    safeReturns: current.safeReturns + (isReturn ? 1 : 0),
    deaths: current.deaths + (isReturn ? 0 : 1),
    enemiesDefeated: current.enemiesDefeated + run.enemiesDefeated,
    npcsMet: current.npcsMet + run.npcsMet,
    eventsFound: current.eventsFound + run.eventsFound,
    deepestDepth: Math.max(current.deepestDepth, run.depth),
    renown: current.renown + settlement.bankedRenown,
    historyFragments: current.historyFragments + settlement.bankedHistoryFragments,
    renownLost: current.renownLost + settlement.lostRenown,
    historyFragmentsLost: current.historyFragmentsLost + settlement.lostHistoryFragments,
    goldLost: current.goldLost + settlement.goldLost,
    weaponsDamaged: current.weaponsDamaged + (settlement.penaltyType === 'weapon-damaged' ? 1 : 0),
    robberies: current.robberies + (settlement.penaltyType === 'robbed' ? 1 : 0),
    seenHistoryCardIds: [...new Set([...current.seenHistoryCardIds, ...run.seenHistoryCardIds])],
    completionUnlocked: current.completionUnlocked || settlement.completionUnlocked === true,
    lastSettlementId: settlement.id,
  });
};

export const unlockExpeditionHistoryCard = (stats, cardId) => {
  const current = sanitizeExpeditionStats(stats);
  const card = getExpeditionHistoryCardById(cardId);
  if (!card) return { stats: current, result: 'missing-card' };
  if (!current.seenHistoryCardIds.includes(cardId)) return { stats: current, result: 'not-seen' };
  if (current.unlockedHistoryCardIds.includes(cardId)) return { stats: current, result: 'already-unlocked' };
  if (current.historyFragments < card.fragmentCost) return { stats: current, result: 'insufficient-fragments' };
  return {
    stats: sanitizeExpeditionStats({
      ...current,
      historyFragments: current.historyFragments - card.fragmentCost,
      historyFragmentsSpent: current.historyFragmentsSpent + card.fragmentCost,
      unlockedHistoryCardIds: [...current.unlockedHistoryCardIds, cardId],
    }),
    result: 'unlocked',
    card,
  };
};

const sanitizeQueuedEnemyAction = value => {
  if (!isRecord(value)) return null;
  return {
    turn: safeInteger(value.turn, 1, 1, 999_999),
    attackName: safeText(value.attackName, '반격', 80),
    telegraphText: safeText(value.telegraphText, '공격을 준비한다.', 160),
    rawDamage: safeInteger(value.rawDamage, 1, 1, 9999),
    multiplier: safeInteger(value.multiplier, 100, 100, 300),
    power: value.power === true,
  };
};

const sanitizeSettlement = (value, runId) => {
  if (!isRecord(value) || !['return', 'defeat'].includes(value.kind)) return null;
  return {
    id: safeText(value.id, `${runId}:${value.kind}`, 160),
    kind: value.kind,
    bankedRenown: safeInteger(value.bankedRenown),
    bankedHistoryFragments: safeInteger(value.bankedHistoryFragments),
    bankedLoot: sanitizeLootRecord(value.bankedLoot),
    lostRenown: safeInteger(value.lostRenown),
    lostHistoryFragments: safeInteger(value.lostHistoryFragments),
    lostLoot: sanitizeLootRecord(value.lostLoot),
    goldLost: safeInteger(value.goldLost, 0, 0, EXPEDITION_RULES.deathCoinLossCap),
    goldBefore: value.goldBefore === null ? null : safeInteger(value.goldBefore),
    goldAfter: value.goldAfter === null ? null : safeInteger(value.goldAfter),
    penaltyType: ['weapon-damaged', 'robbed'].includes(value.penaltyType) ? value.penaltyType : null,
    completionUnlocked: value.completionUnlocked === true,
  };
};

const migrateV2Run = value => {
  const source = { ...value, version: RUN_VERSION };
  source.pendingLoot = {};
  source.lastDrop = {};
  source.recentEncounterTypes = Array.isArray(source.recentEncounterTypes)
    ? source.recentEncounterTypes
    : source.encounter?.type ? [source.encounter.type] : [];
  source.enemyStreak = source.encounter?.type === 'enemy' ? 1 : 0;
  source.playerTurnsTaken = 0;
  source.enemyTurnsTaken = 0;
  source.activeEffects = { ...EMPTY_ACTIVE_EFFECTS };
  source.queuedEnemyAction = null;
  source.usedSupply = null;
  source.goldLossMultiplier = 1;
  if (isRecord(source.settlement)) {
    source.settlement = {
      ...source.settlement,
      bankedLoot: {},
      lostLoot: {},
    };
  }
  if (source.phase === 'enemy-attack') source.phase = 'player-attack';
  return source;
};

const isEncounterValidAtDepth = (entry, depth) => {
  const region = getExpeditionRegion(depth);
  return entry.regionId === region.id && depth >= entry.depthMin && depth <= entry.depthMax;
};

export const sanitizeExpeditionRun = value => {
  if (!isRecord(value)) return null;
  const sourceVersion = safeInteger(value.version, -1, -1, 999);
  if (![LEGACY_RUN_VERSION, RUN_VERSION].includes(sourceVersion)) return null;
  const source = sourceVersion === LEGACY_RUN_VERSION ? migrateV2Run(value) : value;
  const runId = safeText(source.runId, '', 120);
  if (!runId) return null;
  const weaponTier = safeInteger(source.weaponTier, 1, 1, 7);
  const depth = safeInteger(source.depth, 1, 1, EXPEDITION_RULES.maxDepth);
  const encounterBase = getExpeditionEncounterById(source.encounter?.id);
  if (!encounterBase || !isEncounterValidAtDepth(encounterBase, depth)) return null;
  const encounter = materializeEncounter(encounterBase, depth);
  const supply = sanitizeSupplySnapshot(source.usedSupply);
  const player = getExpeditionPlayerStats(weaponTier, supply);
  const enemyPhases = new Set([
    'enemy-intro', 'player-attack', 'enemy-telegraph', 'enemy-attack', 'victory',
    'decision', 'defeat', 'returned', 'defeated',
  ]);
  const supportPhases = new Set([`${encounter.type}-intro`, 'decision', 'returned', 'defeated']);
  if (encounter.choices?.length === 2) supportPhases.add(`${encounter.type}-choice`);
  const allowedPhases = encounter.type === 'enemy' ? enemyPhases : supportPhases;
  if (!allowedPhases.has(source.phase)) return null;
  const phase = source.phase;
  const settled = source.settled === true && ['returned', 'defeated'].includes(phase);
  const settlement = settled ? sanitizeSettlement(source.settlement, runId) : null;
  if (['returned', 'defeated'].includes(phase)) {
    const expectedKind = phase === 'returned' ? 'return' : 'defeat';
    if (!settled || !settlement || settlement.kind !== expectedKind || settlement.id !== `${runId}:${expectedKind}`) return null;
  } else if (source.settled === true || source.settlement) {
    return null;
  }

  const enemyMaxHp = encounter.type === 'enemy' ? encounter.maxHp : 0;
  const enemyHp = encounter.type === 'enemy'
    ? safeInteger(source.enemyHp, enemyMaxHp, 0, enemyMaxHp)
    : 0;
  const playerHp = safeInteger(source.playerHp, player.maxHp, 0, player.maxHp);
  const pendingRenown = safeInteger(source.pendingRenown);
  const pendingHistoryFragments = safeInteger(source.pendingHistoryFragments);
  const pendingLoot = sanitizeLootRecord(source.pendingLoot);
  if (encounter.type === 'enemy') {
    if (['victory', 'decision'].includes(phase) && enemyHp !== 0) return null;
    if (['enemy-intro', 'player-attack', 'enemy-telegraph', 'enemy-attack'].includes(phase) && (enemyHp <= 0 || playerHp <= 0)) return null;
    if (phase === 'defeat' && playerHp !== 0) return null;
    if (phase === 'returned' && enemyHp !== 0) return null;
  }
  if (phase === 'defeated' && playerHp !== 0) return null;
  if (settled && (pendingRenown > 0 || pendingHistoryFragments > 0 || countLoot(pendingLoot) > 0)) return null;

  const queuedEnemyAction = sanitizeQueuedEnemyAction(source.queuedEnemyAction);
  if (['enemy-telegraph', 'enemy-attack'].includes(phase) && !queuedEnemyAction) return null;
  const recentEncounterIds = uniqueKnownIds(source.recentEncounterIds, ENCOUNTER_IDS, EXPEDITION_RULES.recentEncounterLimit);
  if (!recentEncounterIds.includes(encounter.id)) recentEncounterIds.push(encounter.id);
  const recentEncounterTypes = Array.isArray(source.recentEncounterTypes)
    ? source.recentEncounterTypes.filter(type => ENCOUNTER_TYPES.includes(type)).slice(-EXPEDITION_RULES.recentEncounterTypeLimit)
    : [];
  if (recentEncounterTypes.at(-1) !== encounter.type) recentEncounterTypes.push(encounter.type);
  const encounteredIds = uniqueKnownIds(source.encounteredIds, ENCOUNTER_IDS, EXPEDITION_RULES.maxDepth);
  if (!encounteredIds.includes(encounter.id)) encounteredIds.push(encounter.id);
  const seenHistoryCardIds = uniqueKnownIds(source.seenHistoryCardIds, HISTORY_CARD_IDS, HISTORY_CARD_IDS.size);
  if (!seenHistoryCardIds.includes(encounter.historyCardId)) seenHistoryCardIds.push(encounter.historyCardId);
  const step = safeInteger(source.step, 0, 0, 999_999);
  const lastAction = createLastAction({
    id: Math.min(step, safeInteger(source.lastAction?.id, 0, 0, 999_999)),
    actor: source.lastAction?.actor,
    attackName: source.lastAction?.attackName,
    damage: source.lastAction?.damage,
    critical: source.lastAction?.critical,
    power: source.lastAction?.power,
    telegraph: source.lastAction?.telegraph,
    healed: source.lastAction?.healed,
    guarded: source.lastAction?.guarded,
    attackBonus: source.lastAction?.attackBonus,
    critMultiplier: source.lastAction?.critMultiplier,
    text: safeText(source.lastAction?.text, encounter.intro, 360),
  });

  return {
    version: RUN_VERSION,
    runId,
    phase,
    depth,
    weaponTier,
    weaponName: safeText(source.weaponName, WEAPON_TIMELINE[weaponTier].name, 80),
    playerHp,
    playerMaxHp: player.maxHp,
    playerAttack: player.attack,
    combatProfile: player.combatProfile,
    usedSupply: supply,
    goldLossMultiplier: player.goldLossMultiplier,
    pendingRenown,
    pendingHistoryFragments,
    pendingLoot,
    lastDrop: sanitizeLootRecord(source.lastDrop),
    enemiesDefeated: safeInteger(source.enemiesDefeated),
    npcsMet: safeInteger(source.npcsMet),
    eventsFound: safeInteger(source.eventsFound),
    seenHistoryCardIds,
    encounter,
    enemyHp,
    enemyMaxHp,
    rngState: normalizeRngState(source.rngState),
    recentEncounterIds: recentEncounterIds.slice(-EXPEDITION_RULES.recentEncounterLimit),
    recentEncounterTypes: recentEncounterTypes.slice(-EXPEDITION_RULES.recentEncounterTypeLimit),
    enemyStreak: safeInteger(source.enemyStreak, encounter.type === 'enemy' ? 1 : 0, 0, 99),
    encounteredIds,
    playerTurnsTaken: safeInteger(source.playerTurnsTaken, 0, 0, 999_999),
    enemyTurnsTaken: safeInteger(source.enemyTurnsTaken, 0, 0, 999_999),
    activeEffects: sanitizeActiveEffects(source.activeEffects),
    queuedEnemyAction: ['enemy-telegraph', 'enemy-attack'].includes(phase) ? queuedEnemyAction : null,
    step,
    lastAction,
    settled,
    settlement,
  };
};
