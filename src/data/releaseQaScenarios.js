import {
  createExpeditionRun,
  sanitizeExpeditionRun,
  selectExpeditionEncounter,
} from './expedition.js';
import { WEAPON_TIMELINE } from './weaponTimeline.js';

export const RELEASE_QA_WEAPON_TIER = 7;

const getReleaseQaSupportSelection = (type) => {
  for (let seed = 101; seed <= 5000; seed += 1) {
    const selected = selectExpeditionEncounter({
      depth: 2,
      rngState: seed,
      recentEncounterIds: [],
      recentEncounterTypes: [],
      enemyStreak: 0,
    });
    if (selected.encounter.type === type && selected.encounter.choices?.length === 2) {
      return selected;
    }
  }
  throw new Error(`릴리스 QA용 선택형 ${type} 조우를 찾지 못했습니다.`);
};

export const buildReleaseQaChoiceRun = (type) => {
  if (!['npc', 'event'].includes(type)) {
    throw new Error(`지원하지 않는 릴리스 QA 선택 조우 유형입니다: ${type}`);
  }

  const weapon = WEAPON_TIMELINE[RELEASE_QA_WEAPON_TIER];
  const base = createExpeditionRun({
    runId: `release-qa-${type}-choice-preview`,
    weaponTier: RELEASE_QA_WEAPON_TIER,
    weaponName: weapon.name,
    seed: 71237,
  });
  const selected = getReleaseQaSupportSelection(type);
  const encounter = selected.encounter;
  const run = sanitizeExpeditionRun({
    ...base,
    phase: `${type}-choice`,
    depth: 2,
    encounter,
    enemyHp: 0,
    enemyMaxHp: 0,
    rngState: selected.rngState,
    recentEncounterIds: selected.recentEncounterIds,
    recentEncounterTypes: selected.recentEncounterTypes,
    enemyStreak: selected.enemyStreak,
    encounteredIds: [base.encounter.id, encounter.id],
    seenHistoryCardIds: [...new Set([base.encounter.historyCardId, encounter.historyCardId])],
    lastDrop: {},
    queuedEnemyAction: null,
    step: 1,
    lastAction: {
      id: 1,
      actor: type,
      text: encounter.choicePrompt,
    },
  });

  if (!run) throw new Error(`릴리스 QA 선택형 ${type} 상태가 sanitize 검증에 실패했습니다.`);
  return run;
};

export const buildReleaseQaCombatRun = (feedbackType) => {
  if (!['player-feedback', 'guard-feedback'].includes(feedbackType)) {
    throw new Error(`지원하지 않는 릴리스 QA 전투 피드백 유형입니다: ${feedbackType}`);
  }

  const weapon = WEAPON_TIMELINE[RELEASE_QA_WEAPON_TIER];
  const base = createExpeditionRun({
    runId: `release-qa-combat-${feedbackType}-preview`,
    weaponTier: RELEASE_QA_WEAPON_TIER,
    weaponName: weapon.name,
    seed: 982451,
  });
  const isPlayerFeedback = feedbackType === 'player-feedback';
  const run = sanitizeExpeditionRun({
    ...base,
    phase: 'player-attack',
    playerHp: base.playerMaxHp - 12,
    step: 1,
    lastAction: isPlayerFeedback
      ? {
          id: 1,
          actor: 'player',
          attackName: base.combatProfile.attackName,
          damage: 42,
          critical: true,
          healed: Math.max(1, base.combatProfile.healOnHit),
          attackBonus: 18,
          critMultiplier: base.combatProfile.critMultiplier,
          text: `[릴리스 QA] ${base.combatProfile.attackName} · 치명타/적중 회복/지원 공격 배지 동시 표시`,
        }
      : {
          id: 1,
          actor: 'enemy',
          damage: 8,
          guarded: Math.max(1, base.combatProfile.guard),
          text: '[릴리스 QA] 적 공격을 방어해 피해 경감 배지를 표시한다.',
        },
  });

  if (!run) throw new Error(`릴리스 QA 전투 ${feedbackType} 상태가 sanitize 검증에 실패했습니다.`);
  return run;
};
