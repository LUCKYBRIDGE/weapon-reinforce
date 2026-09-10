import assert from 'node:assert/strict';

import {
  buildReleaseQaChoiceRun,
  buildReleaseQaCombatRun,
  RELEASE_QA_WEAPON_TIER,
} from '../src/data/releaseQaScenarios.js';

const npc = buildReleaseQaChoiceRun('npc');
const event = buildReleaseQaChoiceRun('event');
const playerFeedback = buildReleaseQaCombatRun('player-feedback');
const guardFeedback = buildReleaseQaCombatRun('guard-feedback');

for (const [type, run] of [['npc', npc], ['event', event]]) {
  assert.equal(run.weaponTier, RELEASE_QA_WEAPON_TIER);
  assert.equal(run.phase, `${type}-choice`);
  assert.equal(run.encounter.type, type);
  assert.equal(run.encounter.choices.length, 2);
  assert.equal(run.settled, false);
  assert.match(run.runId, /^release-qa-/);
}

assert.equal(playerFeedback.phase, 'player-attack');
assert.equal(playerFeedback.lastAction.actor, 'player');
assert.equal(playerFeedback.lastAction.critical, true);
assert(playerFeedback.lastAction.healed > 0, '플레이어 QA 피드백에 적중 회복이 없습니다.');
assert(playerFeedback.lastAction.attackBonus > 0, '플레이어 QA 피드백에 지원 공격 보너스가 없습니다.');
assert(playerFeedback.lastAction.critMultiplier > 1, '플레이어 QA 피드백에 치명타 배율이 없습니다.');

assert.equal(guardFeedback.phase, 'player-attack');
assert.equal(guardFeedback.lastAction.actor, 'enemy');
assert(guardFeedback.lastAction.guarded > 0, '방어 QA 피드백에 피해 경감 수치가 없습니다.');
assert.match(guardFeedback.runId, /^release-qa-/);

console.log(
  '릴리스 QA fixture 검증 통과 · 선택형 NPC/사건 2종 · 치명타/회복/지원공격 동시 피드백 · 방어 경감 피드백',
);
