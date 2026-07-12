import { useEffect, useRef } from 'react';

import {
  EXPEDITION_RULES,
  getExpeditionRenownRank,
} from '../data/expedition.js';
import { getExpeditionLootItem } from '../data/expeditionEconomy.js';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getActionLabel = run => {
  if (run.phase === 'returned') return '안전 귀환';
  if (run.phase === 'defeated' || run.phase === 'defeat') return '강제 귀환';
  if (run.phase === 'enemy-telegraph') return run.queuedEnemyAction?.power ? '⚠️ 강공격 예고' : '⚠️ 상대 공격 예고';
  if (run.phase === 'enemy-attack') return run.lastAction?.power ? '상대 강공격' : '상대 공격';
  if (run.lastAction?.actor === 'player') return run.lastAction.critical ? '내 공격 · 공명 치명타!' : '내 공격';
  if (run.lastAction?.actor === 'enemy') return '상대 공격';
  if (run.lastAction?.actor === 'npc') return 'NPC의 도움';
  if (run.lastAction?.actor === 'event') return '현장 기록';
  if (run.phase === 'enemy-intro') return '적 조우';
  if (run.phase === 'npc-intro') return 'NPC 조우';
  if (run.phase === 'event-intro') return '사건 발견';
  if (run.phase === 'player-attack') return '내 공격 준비';
  if (run.phase === 'victory') return '전투 승리';
  if (run.phase === 'decision') return '진로 선택';
  return '시간 균열 탐사';
};

const getLootEntries = loot => Object.entries(loot || {})
  .filter(([, count]) => Number(count) > 0)
  .map(([itemId, count]) => ({ item: getExpeditionLootItem(itemId), itemId, count }));

const LootChips = ({ loot, emptyLabel = '아직 없음', tone = 'pending' }) => {
  const entries = getLootEntries(loot);
  if (entries.length === 0) return <small className="expedition-loot-empty">{emptyLabel}</small>;
  return (
    <div className={`expedition-loot-chips is-${tone}`}>
      {entries.map(({ item, itemId, count }) => (
        <span key={itemId} title={item?.description || itemId}>
          <i aria-hidden="true">{item?.icon || '🎁'}</i>
          {item?.name || itemId} <strong>{count}</strong>
        </span>
      ))}
    </div>
  );
};

const HpBar = ({ label, value, max, tone = 'player' }) => {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={`expedition-hp is-${tone}`}>
      <div>
        <strong>{label}</strong>
        <span>{value}/{max}</span>
      </div>
      <progress aria-label={`${label} 체력 ${value}/${max}`} max={max} value={value} />
      <small>{percent}%</small>
    </div>
  );
};

const ExpeditionPath = ({ run }) => (
  <ol className="expedition-path" aria-label={`7개 역사층 중 현재 ${run.depth}층`}>
    {Array.from({ length: EXPEDITION_RULES.maxDepth }, (_, index) => index + 1).map(depth => {
      const state = depth < run.depth ? 'complete' : depth === run.depth ? 'current' : 'locked';
      return (
        <li key={depth} className={`is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
          <span>{state === 'complete' ? '✓' : depth}</span>
          <small>{depth}층</small>
        </li>
      );
    })}
  </ol>
);

export default function ExpeditionModal({
  run,
  stats,
  speed,
  playerSrc,
  encounterSrc,
  weaponSrc,
  combatStyle,
  battlePose,
  onToggleSpeed,
  onReturn,
  onContinue,
  onSaveCheckpoint,
  onClose,
}) {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const runId = run?.runId || null;
  const isFinal = run?.phase === 'returned' || run?.phase === 'defeated';

  useEffect(() => {
    if (!runId) return undefined;
    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    return () => {
      const returnTarget = returnFocusRef.current;
      returnFocusRef.current = null;
      if (returnTarget?.isConnected) returnTarget.focus({ preventScroll: true });
    };
  }, [runId]);

  useEffect(() => {
    if (!runId) return undefined;
    const frameId = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const preferredControl = dialog.querySelector(
        isFinal ? '[data-expedition-final-focus]' : '[data-expedition-open-focus]',
      );
      (preferredControl || dialog).focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isFinal, runId]);

  if (!run) return null;

  const isEnemy = run.encounter?.type === 'enemy';
  const isNpc = run.encounter?.type === 'npc';
  const isEvent = run.encounter?.type === 'event';
  const isPlayerStrike = run.lastAction?.actor === 'player';
  const isEnemyStrike = run.lastAction?.actor === 'enemy';
  const isEnemyTelegraph = run.phase === 'enemy-telegraph';
  const canChoose = run.phase === 'decision';
  const atMaxDepth = run.depth >= EXPEDITION_RULES.maxDepth;
  const settlement = run.settlement;
  const pendingLootCount = getLootEntries(run.pendingLoot).reduce((sum, entry) => sum + entry.count, 0);
  const bankedLootCount = getLootEntries(settlement?.bankedLoot).reduce((sum, entry) => sum + entry.count, 0);
  const lostLootCount = getLootEntries(settlement?.lostLoot).reduce((sum, entry) => sum + entry.count, 0);
  const dialogueText = isEnemyTelegraph
    ? run.queuedEnemyAction?.telegraphText || run.lastAction?.text
    : run.lastAction?.text;
  const rank = getExpeditionRenownRank(stats.renown);
  const held = battlePose?.held || {};
  const firstPerson = battlePose?.firstPerson || {};
  const stageStyle = {
    '--held-left': `${held.left ?? 50}%`,
    '--held-top': `${held.top ?? 35}%`,
    '--held-width': `${held.width ?? 78}%`,
    '--held-rotation': `${held.rotation ?? -12}deg`,
    '--fp-left': `${firstPerson.left ?? 50}%`,
    '--fp-bottom': `${firstPerson.bottom ?? -20}%`,
    '--fp-width': `${firstPerson.width ?? 70}%`,
    '--fp-rotation': `${firstPerson.rotation ?? -10}deg`,
  };

  const handleDialogKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (isFinal) onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusableControls = [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)]
      .filter(control => control.getAttribute('aria-hidden') !== 'true');
    if (focusableControls.length === 0) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      return;
    }

    const firstControl = focusableControls[0];
    const lastControl = focusableControls[focusableControls.length - 1];
    if (event.shiftKey && document.activeElement === firstControl) {
      event.preventDefault();
      lastControl.focus();
    } else if (!event.shiftKey && document.activeElement === lastControl) {
      event.preventDefault();
      firstControl.focus();
    }
  };

  return (
    <div className="modal-overlay expedition-overlay">
      <div
        ref={dialogRef}
        className={`modal-content expedition-modal phase-${run.phase} action-${run.lastAction?.actor || 'system'} style-${combatStyle} encounter-${run.encounter.type}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expedition-title"
        aria-describedby="expedition-dialogue-text"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        {isFinal && (
          <button className="close-btn expedition-close-btn" type="button" onClick={onClose} aria-label="탐사 결과 닫기">✕</button>
        )}

        <header className="expedition-heading">
          <div>
            <span className="expedition-kicker">후방 반신 대치 · 공격 순간 1인칭 자동전투</span>
            <h2 id="expedition-title">🗺️ 시간 균열 탐사</h2>
          </div>
          <div className="expedition-record" aria-label="누적 탐사 기록">
            <span>{rank.name}</span>
            <span>귀환 {stats.safeReturns}</span>
            <span>사망 {stats.deaths}</span>
          </div>
        </header>

        <ExpeditionPath run={run} />

        <div className="expedition-toolbar">
          <span>{run.encounter.region.name}</span>
          <span>{run.encounter.place}</span>
          <strong>깊이 {run.depth}/{EXPEDITION_RULES.maxDepth}</strong>
          {!isFinal && (
            <button
              type="button"
              className="expedition-save-btn"
              onClick={onSaveCheckpoint}
              aria-label="현재 탐사 체크포인트를 저장 데이터 파일로 내려받기"
            >
              💾 파일 백업
            </button>
          )}
          {!isFinal && (
            <button
              type="button"
              onClick={onToggleSpeed}
              data-expedition-open-focus={!canChoose ? '' : undefined}
              aria-label={`현재 ${speed}배속, ${speed === 1 ? '2배속으로 바꾸기' : '1배속으로 바꾸기'}`}
            >
              ×{speed} 속도
            </button>
          )}
        </div>

        <section
          className={`expedition-stage ${isPlayerStrike ? 'is-player-strike' : ''} ${isEnemyStrike ? 'is-enemy-strike' : ''} ${isEnemyTelegraph ? 'is-enemy-telegraph' : ''}`}
          style={stageStyle}
          aria-label={`${run.encounter.name} 조우 화면`}
        >
          <div className={`expedition-sky tone-${run.encounter.region.tone}`} aria-hidden="true" />
          <div className="expedition-ground" aria-hidden="true" />

          <div className="expedition-player-status">
            <HpBar label={`+${run.weaponTier} 나`} value={run.playerHp} max={run.playerMaxHp} />
          </div>
          {isEnemy && (
            <div className="expedition-enemy-status">
              <HpBar label={run.encounter.name} value={run.enemyHp} max={run.enemyMaxHp} tone="enemy" />
            </div>
          )}

          {isEnemyTelegraph && (
            <div className={`expedition-telegraph-warning ${run.queuedEnemyAction?.power ? 'is-power' : ''}`} role="status">
              <strong>{run.queuedEnemyAction?.power ? '강공격이 온다!' : '상대가 공격을 준비한다'}</strong>
              <span>{run.queuedEnemyAction?.attackName}</span>
            </div>
          )}

          <div className="expedition-player" aria-hidden="true">
            <img className="expedition-player-sprite" src={playerSrc} alt="" />
            {!isNpc && !isEvent && (
              <img
                className={`expedition-held-weapon style-${combatStyle} ${held.flip ? 'is-flipped' : ''}`}
                src={weaponSrc}
                alt=""
              />
            )}
          </div>

          <div
            className={`expedition-opponent is-${run.encounter.type} asset-${run.encounter.assetMode || 'portal'}`}
            aria-hidden="true"
          >
            <i />
            <img src={encounterSrc} alt="" />
          </div>

          {isEnemy && (
            <div className={`first-person-weapon style-${combatStyle} ${firstPerson.flip ? 'is-flipped' : ''}`} aria-hidden="true">
              <b />
              <img src={weaponSrc} alt="" />
              <i />
            </div>
          )}
          <div className="expedition-hit-flash" aria-hidden="true" />

          <div className="expedition-turn-badge">{getActionLabel(run)}</div>
          <div className="expedition-dialogue" role="status" aria-live={speed === 1 ? 'polite' : 'off'} aria-atomic="true">
            <strong>{run.encounter.name}</strong>
            <p id="expedition-dialogue-text">{dialogueText}</p>
          </div>
        </section>

        <section className="expedition-encounter-profile" aria-label="현재 조우와 전투 특징">
          <div>
            <span>{isEnemy ? '적 전투 역할' : isNpc ? 'NPC 역할' : '사건 역할'}</span>
            <strong>{run.encounter.roleLabel}</strong>
            <p>{run.encounter.traitDescription}</p>
          </div>
          <div>
            <span>현재 무기 특징</span>
            <strong>{run.combatProfile.attackName}</strong>
            <p>치명타 {Math.round((run.combatProfile.critChance || 0) * 100)}% · 기본 방어 {run.combatProfile.guard || 0}{run.combatProfile.healOnHit ? ` · 적중 회복 ${run.combatProfile.healOnHit}` : ''}</p>
          </div>
          {run.usedSupply && (
            <div className="expedition-used-supply">
              <span>이번 탐사 준비물</span>
              <strong>{run.usedSupply.icon} {run.usedSupply.name}</strong>
              <p>{run.usedSupply.effectDescription}</p>
            </div>
          )}
        </section>

        {(run.activeEffects.nextAttackBonus > 0 || run.activeEffects.nextGuardBonus > 0 || run.activeEffects.lootBonus > 0) && (
          <div className="expedition-active-effects" aria-label="다음 조우까지 남은 도움 효과">
            <strong>남은 도움 효과</strong>
            {run.activeEffects.nextAttackBonus > 0 && <span>⚔️ 다음 공격 +{run.activeEffects.nextAttackBonus}%</span>}
            {run.activeEffects.nextGuardBonus > 0 && <span>🛡️ 다음 방어 +{run.activeEffects.nextGuardBonus}</span>}
            {run.activeEffects.lootBonus > 0 && <span>🎁 다음 적 전리품 +{run.activeEffects.lootBonus}회</span>}
          </div>
        )}

        <aside className="expedition-history-glimpse">
          <div>
            <span>{run.encounter.historyLayer.title} · {run.encounter.historyLayer.weaponName}</span>
            <p>{run.encounter.historyLayer.shortFact}</p>
          </div>
          <small>{run.encounter.historyLayer.certainty}</small>
        </aside>

        <div className="expedition-loot" aria-label="현재 임시 전리품">
          <div className="expedition-loot-summary">
            <span>임시 명성 <strong>{run.pendingRenown}</strong></span>
            <span>기록 조각 <strong>{run.pendingHistoryFragments}</strong></span>
            <span>가상 재료 <strong>{pendingLootCount}개</strong></span>
          </div>
          <LootChips loot={run.pendingLoot} emptyLabel="이번 탐사에서 얻은 가상 재료가 아직 없어요." />
          <small>역사층을 본 기록은 남지만, 명성·조각·가상 재료는 안전하게 복귀해야 보관됩니다.</small>
        </div>

        {canChoose && (
          <section className="expedition-decision" aria-labelledby="expedition-decision-title">
            <div>
              <span>{isNpc ? '도움을 받은 뒤' : isEvent ? '현장을 기록한 뒤' : '전투에서 살아남았다'}</span>
              <h3 id="expedition-decision-title">이제 어떻게 할까?</h3>
              <p>현재 체력 {run.playerHp}/{run.playerMaxHp} · 쓰러지면 임시 전리품과 최대 {Math.round(EXPEDITION_RULES.deathCoinLossCap * run.goldLossMultiplier)}냥을 잃습니다.</p>
            </div>
            <div className="expedition-actions">
              <button type="button" className="expedition-return-btn" onClick={onReturn} data-expedition-open-focus="">
                안전하게 복귀
                <small>전리품 전부 보관</small>
              </button>
              {!atMaxDepth && (
                <button type="button" className="expedition-continue-btn" onClick={onContinue}>
                  더 깊이 탐사
                  <small>체력을 유지하고 다음 역사층</small>
                </button>
              )}
            </div>
          </section>
        )}

        {run.phase === 'returned' && settlement && (
          <section className="expedition-settlement is-returned" aria-live="polite">
            <span>{settlement.completionUnlocked ? '시간 균열 봉합 성공' : '안전 귀환'}</span>
            <h3>{settlement.completionUnlocked
              ? '일곱 역사층의 기록을 지키고 돌아왔습니다.'
              : '임시 전리품을 대장간 기록으로 옮겼습니다.'}</h3>
            <p>명성 +{settlement.bankedRenown} · 기록 조각 +{settlement.bankedHistoryFragments} · 가상 재료 +{bankedLootCount}개</p>
            <LootChips loot={settlement.bankedLoot} emptyLabel="보관한 가상 재료 없음" tone="banked" />
            <button type="button" onClick={onClose} data-expedition-final-focus="">대장간으로</button>
          </section>
        )}

        {run.phase === 'defeated' && settlement && (
          <section className="expedition-settlement is-defeated" aria-live="assertive">
            <span>탐사 실패</span>
            <h3>{settlement.penaltyType === 'weapon-damaged'
              ? '무기가 크게 손상되어 긴급 수리비를 냈습니다.'
              : '쓰러진 사이 노상강도에게 엽전을 빼앗겼습니다.'}</h3>
            <p>임시 명성 -{settlement.lostRenown} · 기록 조각 -{settlement.lostHistoryFragments} · 가상 재료 -{lostLootCount}개 · 엽전 -{settlement.goldLost}냥</p>
            <LootChips loot={settlement.lostLoot} emptyLabel="잃은 가상 재료 없음" tone="lost" />
            <small>+{run.weaponTier} [{run.weaponName}] 무기는 즉시 수리되어 강화 단계가 보존됩니다.</small>
            <button type="button" onClick={onClose} data-expedition-final-focus="">대장간으로 복귀</button>
          </section>
        )}
      </div>
    </div>
  );
}
