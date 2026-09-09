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
import {
  getMaxRestorableTier,
  GREAT_SUCCESS_RATES,
  RESTORE_SHOP_PRICES,
  rollGreatSuccessStepCount,
  TIMELINE_UPGRADE_RATES,
  TIMING_BONUS,
  TIMING_GRADE_THRESHOLDS,
} from '../src/data/weaponTimeline.js';
import { QUIZ_PACKS, QUIZ_REFERENCE_REWARD } from '../src/data/quizCatalog.js';
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

const simulateConservativeReinforcementJourney = (timingBonus, seed) => {
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

const sampleTimingGrade = (weights, random) => {
  const roll = random();
  let cursor = 0;
  for (const [grade, weight] of Object.entries(weights)) {
    cursor += weight;
    if (roll < cursor) return grade;
  }
  return Object.keys(weights).at(-1) || 'miss';
};

const perfectWindowShare = TIMING_GRADE_THRESHOLDS.perfectDistance * 2 / 100;
const goodOrBetterWindowShare = TIMING_GRADE_THRESHOLDS.goodDistance * 2 / 100;
const goodOnlyWindowShare = goodOrBetterWindowShare - perfectWindowShare;

const TIMING_SCENARIOS = [
  {
    id: 'miss',
    label: '타이밍 미입력',
    weights: { miss: 1 },
  },
  {
    id: 'window-proportional',
    label: '타이밍 창 비례',
    weights: {
      miss: 1 - goodOrBetterWindowShare,
      good: goodOnlyWindowShare,
      perfect: perfectWindowShare,
    },
  },
  {
    id: 'good-perfect-mix',
    label: 'GOOD 이상 혼합',
    weights: {
      good: goodOnlyWindowShare / goodOrBetterWindowShare,
      perfect: perfectWindowShare / goodOrBetterWindowShare,
    },
  },
  {
    id: 'perfect',
    label: '항상 PERFECT',
    weights: { perfect: 1 },
  },
];

const RESTORE_POLICIES = [
  { id: 'none', label: '복원 없음', useHighestAvailable: false },
  { id: 'highest', label: '최고 가능 단계 즉시 복원', useHighestAvailable: true },
];

const simulateRuntimeReinforcementJourney = ({ timingScenario, restorePolicy, seed }) => {
  const random = createSeededRandom(seed);
  const totals = {
    attempts: 0,
    cost: 0,
    restorePurchases: 0,
    doubleGreatSuccesses: 0,
    tripleGreatSuccesses: 0,
    falseAlarms: 0,
  };

  for (let run = 0; run < REINFORCEMENT_JOURNEYS; run += 1) {
    let tier = 1;
    let maxTierEver = 1;

    while (tier < 7) {
      const rate = TIMELINE_UPGRADE_RATES[tier];
      const timingGrade = sampleTimingGrade(timingScenario.weights, random);
      const effectiveRate = Math.min(100, rate.rate + TIMING_BONUS[timingGrade]);

      totals.attempts += 1;
      totals.cost += rate.cost;

      if (random() * 100 <= effectiveRate) {
        const firstTier = Math.min(7, tier + 1);
        const totalSteps = rollGreatSuccessStepCount(tier, random);
        if (totalSteps === 2) totals.doubleGreatSuccesses += 1;
        if (totalSteps === 3) totals.tripleGreatSuccesses += 1;

        tier = Math.min(7, tier + totalSteps);
        maxTierEver = Math.max(maxTierEver, tier);

        if (totalSteps === 1 && firstTier < 7 && random() * 100 < GREAT_SUCCESS_RATES.falseAlarm) {
          totals.falseAlarms += 1;
        }
        continue;
      }

      tier = 1;
      if (restorePolicy.useHighestAvailable) {
        const restoreTier = getMaxRestorableTier(maxTierEver);
        if (restoreTier > 1) {
          totals.cost += RESTORE_SHOP_PRICES[restoreTier];
          totals.restorePurchases += 1;
          tier = restoreTier;
        }
      }
    }
  }

  return Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [key, value / REINFORCEMENT_JOURNEYS]),
  );
};

const conservativeBaseJourney = simulateConservativeReinforcementJourney(0, 71001);
const conservativePerfectJourney = simulateConservativeReinforcementJourney(TIMING_BONUS.perfect, 71002);
const runtimeResults = [];

for (const [timingIndex, timingScenario] of TIMING_SCENARIOS.entries()) {
  for (const [restoreIndex, restorePolicy] of RESTORE_POLICIES.entries()) {
    runtimeResults.push({
      timingScenario,
      restorePolicy,
      result: simulateRuntimeReinforcementJourney({
        timingScenario,
        restorePolicy,
        seed: 72000 + timingIndex * 100 + restoreIndex,
      }),
    });
  }
}

const getRuntimeResult = (timingId, restoreId) => runtimeResults.find(entry => (
  entry.timingScenario.id === timingId && entry.restorePolicy.id === restoreId
))?.result;

const missNoRestore = getRuntimeResult('miss', 'none');
const mixedNoRestore = getRuntimeResult('window-proportional', 'none');
const goodPerfectNoRestore = getRuntimeResult('good-perfect-mix', 'none');
const perfectNoRestore = getRuntimeResult('perfect', 'none');
const mixedRestore = getRuntimeResult('window-proportional', 'highest');
const goodPerfectRestore = getRuntimeResult('good-perfect-mix', 'highest');

assert(missNoRestore.cost < conservativeBaseJourney.cost, '대성공을 포함했는데 MISS 기준 평균 완주 비용이 보수적 기준보다 줄지 않았습니다.');
assert(perfectNoRestore.cost < conservativePerfectJourney.cost, '대성공을 포함했는데 PERFECT 기준 평균 완주 비용이 보수적 기준보다 줄지 않았습니다.');
assert(goodPerfectNoRestore.cost < mixedNoRestore.cost, 'GOOD/PERFECT 혼합 숙련이 타이밍 창 비례 입력보다 비용을 줄이지 못합니다.');
assert(goodPerfectNoRestore.attempts < mixedNoRestore.attempts, 'GOOD/PERFECT 혼합 숙련이 평균 강화 시도 수를 줄이지 못합니다.');
assert(mixedRestore.attempts < mixedNoRestore.attempts, '복원 무기고 사용이 평균 강화 시도 수를 줄이지 못합니다.');
assert(mixedRestore.cost > mixedNoRestore.cost, '비싼 복원 무기고가 복원 없음보다 평균 엽전 소모가 작아졌습니다.');
assert(goodPerfectRestore.attempts < goodPerfectNoRestore.attempts, 'GOOD/PERFECT 혼합에서 복원 무기고가 평균 시도 수를 줄이지 못합니다.');
assert(goodPerfectRestore.cost > goodPerfectNoRestore.cost, 'GOOD/PERFECT 혼합에서 복원 무기고가 비용 trade-off를 만들지 못합니다.');

const missReferenceQuestions = missNoRestore.cost / QUIZ_REFERENCE_REWARD;
const mixedReferenceQuestions = mixedNoRestore.cost / QUIZ_REFERENCE_REWARD;
const goodPerfectReferenceQuestions = goodPerfectNoRestore.cost / QUIZ_REFERENCE_REWARD;
const perfectReferenceQuestions = perfectNoRestore.cost / QUIZ_REFERENCE_REWARD;
const mixedRestoreCostRatio = mixedRestore.cost / mixedNoRestore.cost;
const mixedRestoreAttemptReduction = 1 - mixedRestore.attempts / mixedNoRestore.attempts;

assert(missReferenceQuestions <= 180, `대성공 포함 MISS 완주가 기준팩 평균 ${missReferenceQuestions.toFixed(1)}문제로 180문제를 넘습니다.`);
assert(mixedReferenceQuestions <= 160, `타이밍 창 비례 완주가 기준팩 평균 ${mixedReferenceQuestions.toFixed(1)}문제로 160문제를 넘습니다.`);
assert(goodPerfectReferenceQuestions <= 135, `GOOD/PERFECT 혼합 완주가 기준팩 평균 ${goodPerfectReferenceQuestions.toFixed(1)}문제로 135문제를 넘습니다.`);
assert(perfectReferenceQuestions <= 115, `PERFECT 완주가 기준팩 평균 ${perfectReferenceQuestions.toFixed(1)}문제로 115문제를 넘습니다.`);
assert(mixedRestoreAttemptReduction >= 0.5, '최고 단계 즉시 복원이 평균 강화 시도를 50% 이상 줄이지 못합니다.');
assert(
  mixedRestoreCostRatio >= 1.5 && mixedRestoreCostRatio <= 2.5,
  `복원 무기고 비용 trade-off가 기준 범위 1.5~2.5배를 벗어났습니다: ${mixedRestoreCostRatio.toFixed(2)}배`,
);

console.log('\n+1 → +7 완주 보수적 기준 (대성공·복원 무기고 미사용)');
console.log(`타이밍 미입력: 평균 ${conservativeBaseJourney.attempts.toFixed(1)}회 시도 · ${Math.round(conservativeBaseJourney.cost).toLocaleString()}냥 · 약 ${(conservativeBaseJourney.cost / QUIZ_REFERENCE_REWARD).toFixed(1)}문제`);
console.log(`항상 PERFECT: 평균 ${conservativePerfectJourney.attempts.toFixed(1)}회 시도 · ${Math.round(conservativePerfectJourney.cost).toLocaleString()}냥 · 약 ${(conservativePerfectJourney.cost / QUIZ_REFERENCE_REWARD).toFixed(1)}문제`);

console.log('\n+1 → +7 실제 규칙 시뮬레이션 (대성공 포함)');
console.log('타이밍 | 복원 정책 | 평균 시도 | 평균 소모 | 기준팩 정답 | 복원 | +2대강화 | +3대강화 | 가짜대강화');
for (const entry of runtimeResults) {
  const result = entry.result;
  console.log(
    `${entry.timingScenario.label} | ${entry.restorePolicy.label} | ${result.attempts.toFixed(1)}회 | ${Math.round(result.cost).toLocaleString()}냥 | ${(result.cost / QUIZ_REFERENCE_REWARD).toFixed(1)}문제 | ${result.restorePurchases.toFixed(1)}회 | ${result.doubleGreatSuccesses.toFixed(2)}회 | ${result.tripleGreatSuccesses.toFixed(2)}회 | ${result.falseAlarms.toFixed(2)}회`,
  );
}

const quizRewardProfiles = QUIZ_PACKS.map(pack => ({
  id: pack.id,
  label: pack.label,
  averageReward: (pack.reward[0] + pack.reward[1]) / 2,
}));
const quizRewardGroups = [
  {
    id: 'foundation',
    label: '기초 보상팩',
    packs: quizRewardProfiles.filter(pack => pack.averageReward <= 70),
  },
  {
    id: 'intermediate',
    label: '중간 보상팩',
    packs: quizRewardProfiles.filter(pack => pack.averageReward > 70 && pack.averageReward <= 100),
  },
  {
    id: 'advanced',
    label: '고난도 보상팩',
    packs: quizRewardProfiles.filter(pack => pack.averageReward > 100),
  },
];

const formatQuizRange = (cost, packs) => {
  const rewards = packs.map(pack => pack.averageReward);
  const minReward = Math.min(...rewards);
  const maxReward = Math.max(...rewards);
  return {
    rewardRange: `${minReward.toFixed(1)}~${maxReward.toFixed(1)}냥`,
    questionRange: `${(cost / maxReward).toFixed(0)}~${(cost / minReward).toFixed(0)}문제`,
  };
};

console.log('\n퀴즈 보상대별 예상 정답 수 (복원 없음, 보너스·괴작 판매·칭호 보상 제외)');
for (const scenario of [
  ['타이밍 창 비례', mixedNoRestore],
  ['GOOD 이상 혼합', goodPerfectNoRestore],
  ['항상 PERFECT', perfectNoRestore],
]) {
  const [label, result] = scenario;
  const groupText = quizRewardGroups.map(group => {
    const range = formatQuizRange(result.cost, group.packs);
    return `${group.label} 평균보상 ${range.rewardRange} → ${range.questionRange}`;
  }).join(' · ');
  console.log(`${label}: ${groupText}`);
}

console.log('\n개별 퀴즈팩 예상 정답 수 (GOOD 이상 혼합 · 복원 없음)');
for (const pack of quizRewardProfiles) {
  console.log(
    `${pack.label}: 평균 보상 ${pack.averageReward.toFixed(1)}냥 · 약 ${(goodPerfectNoRestore.cost / pack.averageReward).toFixed(1)}문제`,
  );
}

console.log('\n강화 경제 해석');
console.log(
  `타이밍 창 비례에서 대성공 포함·복원 없음은 보수적 MISS 기준보다 평균 비용을 ${((1 - mixedNoRestore.cost / conservativeBaseJourney.cost) * 100).toFixed(1)}% 줄입니다.`,
);
console.log(
  `최고 가능 단계 즉시 복원은 같은 타이밍에서 평균 시도를 ${((1 - mixedRestore.attempts / mixedNoRestore.attempts) * 100).toFixed(1)}% 줄이는 대신 엽전 소모를 ${((mixedRestore.cost / mixedNoRestore.cost - 1) * 100).toFixed(1)}% 늘립니다.`,
);
console.log('가짜 대강화는 시각 연출만 집계하며 강화 단계·비용·퀴즈 수에는 직접 영향을 주지 않습니다.');
console.log('괴작 판매와 칭호 보상은 플레이어 선택/확률에 따라 추가 엽전을 제공하므로 위 퀴즈 수 계산에서는 보수적으로 제외합니다.');

