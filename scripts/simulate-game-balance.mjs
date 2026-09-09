import {
  advanceExpeditionCombat,
  beginEnemyCombat,
  continueExpedition,
  createExpeditionRun,
  EXPEDITION_RULES,
  finishVictoryScene,
  resolveEventEncounter,
  resolveNpcEncounter,
} from '../src/data/expedition.js';
import { TIMELINE_UPGRADE_RATES } from '../src/data/weaponTimeline.js';
import { QUIZ_REFERENCE_REWARD } from '../src/data/quizCatalog.js';
import { EXPEDITION_SUPPLIES } from '../src/data/expeditionEconomy.js';

const RUNS_PER_TIER = 5_000;
const REINFORCEMENT_JOURNEYS = 20_000;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const createSeededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const resolveNpcForSimulation = expedition => resolveNpcEncounter(
  expedition,
  expedition.encounter?.choices?.[0]?.id,
);
const resolveEventForSimulation = expedition => resolveEventEncounter(
  expedition,
  expedition.encounter?.choices?.[0]?.id,
);

const results = [];
for (let tier = 1; tier <= 7; tier += 1) {
  const random = createSeededRandom(20260710 + tier);
  let completed = 0;
  let deaths = 0;
  let depthTotal = 0;
  let turnsTotal = 0;

  for (let run = 0; run < RUNS_PER_TIER; run += 1) {
    let expedition = createExpeditionRun({
      runId: `${tier}-${run}`,
      weaponTier: tier,
      weaponName: `+${tier} 무기`,
      seed: Math.floor(random() * 0xFFFFFFFF),
    });
    let turns = 0;
    while (!['defeat', 'decision'].includes(expedition.phase) || expedition.depth < EXPEDITION_RULES.maxDepth) {
      if (expedition.phase === 'enemy-intro') expedition = beginEnemyCombat(expedition);
      else if (['player-attack', 'enemy-telegraph', 'enemy-attack'].includes(expedition.phase)) {
        expedition = advanceExpeditionCombat(expedition, random);
        if (expedition.lastAction.actor === 'player' || expedition.lastAction.actor === 'enemy') turns += 1;
      } else if (expedition.phase === 'victory') expedition = finishVictoryScene(expedition);
      else if (expedition.phase === 'npc-intro') expedition = resolveNpcForSimulation(expedition);
      else if (expedition.phase === 'event-intro') expedition = resolveEventForSimulation(expedition);
      else if (expedition.phase === 'decision') expedition = continueExpedition(expedition);
      else break;
      assert(turns < 100, `+${tier} 탐사가 100턴 안에 끝나지 않습니다.`);
      if (expedition.phase === 'defeat') break;
      if (expedition.phase === 'decision' && expedition.depth >= EXPEDITION_RULES.maxDepth) break;
    }
    if (expedition.phase === 'defeat') deaths += 1;
    else completed += 1;
    depthTotal += expedition.depth;
    turnsTotal += turns;
    assert(Number.isFinite(expedition.playerHp) && expedition.playerHp >= 0, '탐사 HP가 유효하지 않습니다.');
  }

  results.push({
    tier,
    completionRate: completed / RUNS_PER_TIER,
    deathRate: deaths / RUNS_PER_TIER,
    averageDepth: depthTotal / RUNS_PER_TIER,
    averageTurns: turnsTotal / RUNS_PER_TIER,
  });
}

assert(results[6].completionRate > results[0].completionRate, '최종 무기가 기본 무기보다 최심부 생존률이 높지 않습니다.');

console.log('등급 | 최심부 생존 | 사망률 | 평균 깊이 | 평균 공격 턴');
for (const result of results) {
  console.log(
    `+${result.tier}   | ${(result.completionRate * 100).toFixed(1)}%       | ${(result.deathRate * 100).toFixed(1)}% | ${result.averageDepth.toFixed(2)}      | ${result.averageTurns.toFixed(1)}`,
  );
}

console.log(`탐사 단계별 ${RUNS_PER_TIER.toLocaleString()}회, 총 ${(RUNS_PER_TIER * 7).toLocaleString()}회 시뮬레이션 통과`);

const simulateExpeditionCompletion = ({ tier, supply, seed }) => {
  const random = createSeededRandom(seed);
  let completed = 0;
  let deaths = 0;
  let depthTotal = 0;

  for (let run = 0; run < RUNS_PER_TIER; run += 1) {
    let expedition = createExpeditionRun({
      runId: `supply-${supply?.id || 'none'}-${tier}-${run}`,
      weaponTier: tier,
      weaponName: `+${tier} 무기`,
      seed: Math.floor(random() * 0xFFFFFFFF),
      supply,
    });
    let turns = 0;

    while (!['defeat', 'decision'].includes(expedition.phase) || expedition.depth < EXPEDITION_RULES.maxDepth) {
      if (expedition.phase === 'enemy-intro') expedition = beginEnemyCombat(expedition);
      else if (['player-attack', 'enemy-telegraph', 'enemy-attack'].includes(expedition.phase)) {
        expedition = advanceExpeditionCombat(expedition, random);
        if (expedition.lastAction.actor === 'player' || expedition.lastAction.actor === 'enemy') turns += 1;
      } else if (expedition.phase === 'victory') expedition = finishVictoryScene(expedition);
      else if (expedition.phase === 'npc-intro') expedition = resolveNpcForSimulation(expedition);
      else if (expedition.phase === 'event-intro') expedition = resolveEventForSimulation(expedition);
      else if (expedition.phase === 'decision') expedition = continueExpedition(expedition);
      else break;

      assert(turns < 100, `+${tier} 준비물 비교 탐사가 100턴 안에 끝나지 않습니다.`);
      if (expedition.phase === 'defeat') break;
      if (expedition.phase === 'decision' && expedition.depth >= EXPEDITION_RULES.maxDepth) break;
    }

    if (expedition.phase === 'defeat') deaths += 1;
    else completed += 1;
    depthTotal += expedition.depth;
  }

  return {
    completionRate: completed / RUNS_PER_TIER,
    deathRate: deaths / RUNS_PER_TIER,
    averageDepth: depthTotal / RUNS_PER_TIER,
  };
};

console.log('\n+7 최심부 생존 준비물 비교');
const supplyScenarios = [
  { id: 'none', name: '준비물 없음', supply: null },
  ...EXPEDITION_SUPPLIES.map(supply => ({ id: supply.id, name: supply.name, supply })),
];
const supplyResults = new Map();
for (const scenario of supplyScenarios) {
  const result = simulateExpeditionCompletion({
    tier: 7,
    supply: scenario.supply,
    seed: 20261200,
  });
  supplyResults.set(scenario.id, result);
  console.log(
    `${scenario.name}: 최심부 생존 ${(result.completionRate * 100).toFixed(1)}% · 사망 ${(result.deathRate * 100).toFixed(1)}% · 평균 깊이 ${result.averageDepth.toFixed(2)}`,
  );
}

const noSupplyResult = supplyResults.get('none');
const bandageResult = supplyResults.get('travel-bandage');
const clothResult = supplyResults.get('maintenance-cloth');
const pouchResult = supplyResults.get('safe-pouch');
assert(results[5].completionRate <= 0.05, `+6 최심부 생존률이 ${(results[5].completionRate * 100).toFixed(1)}%로 5%를 넘습니다.`);
assert(
  noSupplyResult.completionRate >= 0.20 && noSupplyResult.completionRate <= 0.30,
  `+7 무준비 최심부 생존률이 목표 20~30%를 벗어났습니다: ${(noSupplyResult.completionRate * 100).toFixed(1)}%`,
);
for (const [name, result] of [['여행 붕대', bandageResult], ['공명 손질 천', clothResult]]) {
  assert(
    result.completionRate >= 0.30 && result.completionRate <= 0.45,
    `+7 ${name} 최심부 생존률이 목표 30~45%를 벗어났습니다: ${(result.completionRate * 100).toFixed(1)}%`,
  );
}
assert(
  pouchResult.completionRate === noSupplyResult.completionRate,
  '전투 능력이 없는 균열 안전 주머니가 동일 시드에서 최심부 생존률을 바꿨습니다.',
);

const simulateReinforcementJourney = (timingBonus, seed) => {
  const random = createSeededRandom(seed);
  let totalAttempts = 0;
  let totalCost = 0;

  for (let run = 0; run < REINFORCEMENT_JOURNEYS; run += 1) {
    let tier = 1;
    while (tier < 7) {
      const rate = TIMELINE_UPGRADE_RATES[tier];
      totalAttempts += 1;
      totalCost += rate.cost;
      tier = random() * 100 <= rate.rate + timingBonus ? tier + 1 : 1;
    }
  }

  return {
    attempts: totalAttempts / REINFORCEMENT_JOURNEYS,
    cost: totalCost / REINFORCEMENT_JOURNEYS,
  };
};

const baseJourney = simulateReinforcementJourney(0, 71001);
const perfectJourney = simulateReinforcementJourney(7, 71002);
assert(perfectJourney.attempts < baseJourney.attempts, 'PERFECT 보너스가 평균 강화 시도 수를 줄이지 못합니다.');
assert(perfectJourney.cost < baseJourney.cost, 'PERFECT 보너스가 평균 강화 비용을 줄이지 못합니다.');
const baseQuizCount = baseJourney.cost / QUIZ_REFERENCE_REWARD;
const perfectQuizCount = perfectJourney.cost / QUIZ_REFERENCE_REWARD;
assert(baseQuizCount <= 260, `기본 판정 완주가 평균 ${baseQuizCount.toFixed(1)}문제로 너무 깁니다.`);
assert(perfectQuizCount <= 150, `PERFECT 완주가 평균 ${perfectQuizCount.toFixed(1)}문제로 너무 깁니다.`);

console.log('\n+1 → +7 완주 보수적 기준 (대성공·복원 무기고 미사용)');
console.log(`기본 판정: 평균 ${baseJourney.attempts.toFixed(1)}회 시도 · ${Math.round(baseJourney.cost).toLocaleString()}냥 · 약 ${baseQuizCount.toFixed(1)}문제`);
console.log(`항상 PERFECT: 평균 ${perfectJourney.attempts.toFixed(1)}회 시도 · ${Math.round(perfectJourney.cost).toLocaleString()}냥 · 약 ${perfectQuizCount.toFixed(1)}문제`);
