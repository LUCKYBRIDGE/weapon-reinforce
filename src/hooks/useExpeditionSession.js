import { useCallback, useEffect, useRef, useState } from 'react';
import {
  advanceExpeditionCombat,
  applyExpeditionSettlement,
  beginEnemyCombat,
  continueExpedition,
  createExpeditionRun,
  EXPEDITION_RULES,
  finishVictoryScene,
  migrateLegacyEncounterStats,
  resolveEventEncounter,
  resolveNpcEncounter,
  sanitizeExpeditionRun,
  sanitizeExpeditionStats,
  settleExpeditionDefeat,
  settleExpeditionReturn,
  unlockExpeditionHistoryCard,
} from '../data/expedition.js';
import {
  applyExpeditionLootSettlement,
  consumeEquippedExpeditionSupply,
  equipExpeditionSupply,
  getExpeditionSupply,
  purchaseExpeditionSupply,
  sanitizeExpeditionEconomy,
} from '../data/expeditionEconomy.js';
import { TIMELINE_UPGRADE_RATES } from '../data/weaponTimeline.js';
import { readStoredObject } from '../data/safeStorage.js';

const persistActiveExpedition = (run, onFailure) => {
  try {
    if (run) localStorage.setItem('weaponActiveExpeditionV1', JSON.stringify(run));
    else localStorage.removeItem('weaponActiveExpeditionV1');
    return true;
  } catch (error) {
    onFailure?.(error);
    return false;
  }
};

const persistExpeditionEconomy = (economy, onFailure) => {
  try {
    localStorage.setItem('weaponExpeditionEconomyV1', JSON.stringify(economy));
    return true;
  } catch (error) {
    onFailure?.(error);
    return false;
  }
};

export default function useExpeditionSession({
  tier,
  weaponName,
  gold,
  setGold,
  isEnhancing,
  outcome,
  playSfx,
  addLog,
  onStorageFailure,
}) {
  const [expedition, setExpedition] = useState(() => sanitizeExpeditionRun(
    readStoredObject('weaponActiveExpeditionV1'),
  ));
  const [expeditionSpeed, setExpeditionSpeed] = useState(1);
  const [expeditionStats, setExpeditionStats] = useState(() => {
    const saved = readStoredObject('weaponExpeditionStatsV1');
    if (Object.keys(saved).length > 0) return sanitizeExpeditionStats(saved);
    return migrateLegacyEncounterStats(readStoredObject('randomEncounterStats'));
  });
  const [expeditionEconomy, setExpeditionEconomy] = useState(() => sanitizeExpeditionEconomy(
    readStoredObject('weaponExpeditionEconomyV1'),
  ));

  const expeditionRunCounterRef = useRef(0);
  const expeditionSettlementLockRef = useRef(new Set());
  const expeditionEconomyTransactionRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem('weaponExpeditionStatsV1', JSON.stringify(expeditionStats));
    } catch (error) {
      onStorageFailure?.(error);
    }
  }, [expeditionStats, onStorageFailure]);

  useEffect(() => {
    persistActiveExpedition(expedition, onStorageFailure);
  }, [expedition, onStorageFailure]);

  useEffect(() => {
    persistExpeditionEconomy(expeditionEconomy, onStorageFailure);
  }, [expeditionEconomy, onStorageFailure]);

  const flushActiveExpedition = useCallback(() => (
    persistActiveExpedition(expedition, onStorageFailure)
  ), [expedition, onStorageFailure]);

  const handleUnlockHistoryCard = useCallback((cardId) => {
    const unlocked = unlockExpeditionHistoryCard(expeditionStats, cardId);
    if (unlocked.result !== 'unlocked') return;

    setExpeditionStats(unlocked.stats);
    playSfx('success');
    addLog(`📜 기록 조각으로 [${unlocked.card.weaponName}] 역사 기록을 복원했습니다.`, 'success');
  }, [addLog, expeditionStats, playSfx]);

  const openExpedition = useCallback(() => {
    if (isEnhancing || outcome || expedition) return;

    expeditionRunCounterRef.current += 1;
    const runId = `${Date.now()}-${expeditionRunCounterRef.current}`;
    const supplyUse = consumeEquippedExpeditionSupply(expeditionEconomy, {
      transactionId: `supply-use:${runId}`,
    });
    const nextRun = createExpeditionRun({
      runId,
      weaponTier: tier,
      weaponName,
      supply: supplyUse.supply,
    });

    setExpeditionSpeed(1);
    persistActiveExpedition(nextRun, onStorageFailure);
    persistExpeditionEconomy(supplyUse.economy, onStorageFailure);
    setExpeditionEconomy(supplyUse.economy);
    setExpedition(nextRun);
    playSfx('page');
    addLog(
      `🗺️ +${tier} [${weaponName}]을 들고 시간 균열 탐사를 시작했습니다.${supplyUse.supply ? ` 준비물 [${supplyUse.supply.name}]을 사용했습니다.` : ''}`,
      'info',
    );
  }, [
    addLog,
    expedition,
    expeditionEconomy,
    isEnhancing,
    onStorageFailure,
    outcome,
    playSfx,
    tier,
    weaponName,
  ]);

  const handleContinueExpedition = useCallback(() => {
    if (!expedition || expedition.phase !== 'decision') return;

    const next = continueExpedition(expedition);
    if (next === expedition) return;

    persistActiveExpedition(next, onStorageFailure);
    setExpedition(next);
    playSfx('page');
  }, [expedition, onStorageFailure, playSfx]);

  const handleReturnExpedition = useCallback(() => {
    if (!expedition || expedition.phase !== 'decision') return;

    const settled = settleExpeditionReturn(expedition);
    const settlementId = settled.settlement?.id;
    if (!settlementId || expeditionSettlementLockRef.current.has(settlementId)) return;
    expeditionSettlementLockRef.current.add(settlementId);

    const nextStats = applyExpeditionSettlement(expeditionStats, settled);
    const nextEconomy = applyExpeditionLootSettlement(expeditionEconomy, settled);

    persistActiveExpedition(settled, onStorageFailure);
    persistExpeditionEconomy(nextEconomy, onStorageFailure);
    try {
      localStorage.setItem('weaponExpeditionStatsV1', JSON.stringify(nextStats));
    } catch (error) {
      onStorageFailure?.(error);
    }

    setExpedition(settled);
    setExpeditionStats(nextStats);
    setExpeditionEconomy(nextEconomy);
    playSfx('success');
    addLog(
      `🏕️ 탐사 안전 귀환! 명성 +${settled.settlement.bankedRenown}, 기록 조각 +${settled.settlement.bankedHistoryFragments}, 전리품 +${Object.values(settled.settlement.bankedLoot).reduce((sum, count) => sum + count, 0)}개`,
      'success',
    );
  }, [
    addLog,
    expedition,
    expeditionEconomy,
    expeditionStats,
    onStorageFailure,
    playSfx,
  ]);

  const handleCloseExpedition = useCallback(() => {
    if (!expedition || !['returned', 'defeated'].includes(expedition.phase)) return;

    persistActiveExpedition(null, onStorageFailure);
    setExpedition(null);
    playSfx('page');
  }, [expedition, onStorageFailure, playSfx]);

  useEffect(() => {
    if (!expedition || expedition.settled) return undefined;

    const automatedPhases = [
      'enemy-intro',
      'player-attack',
      'enemy-telegraph',
      'enemy-attack',
      'victory',
      'npc-intro',
      'event-intro',
    ];
    if (!automatedPhases.includes(expedition.phase)) return undefined;

    const expectedRunId = expedition.runId;
    const expectedPhase = expedition.phase;
    const expectedStep = expedition.step;
    const baseDelay = expeditionSpeed === 2
      ? EXPEDITION_RULES.fastTurnDelayMs
      : EXPEDITION_RULES.turnDelayMs;
    const delay = ['enemy-intro', 'enemy-telegraph', 'npc-intro', 'event-intro'].includes(expectedPhase)
      ? Math.round(baseDelay * 1.15)
      : baseDelay;

    const timer = window.setTimeout(() => {
      if (expectedPhase === 'player-attack') {
        playSfx(expedition.weaponTier === 1 ? 'shot' : 'swing');
      } else if (expectedPhase === 'enemy-telegraph') {
        playSfx('hit');
      } else if (expectedPhase === 'victory') {
        playSfx('success');
      } else {
        playSfx('page');
      }

      setExpedition(current => {
        if (
          !current
          || current.runId !== expectedRunId
          || current.phase !== expectedPhase
          || current.step !== expectedStep
        ) return current;

        if (expectedPhase === 'enemy-intro') return beginEnemyCombat(current);
        if (['player-attack', 'enemy-telegraph', 'enemy-attack'].includes(expectedPhase)) {
          return advanceExpeditionCombat(current);
        }
        if (expectedPhase === 'victory') return finishVictoryScene(current);
        if (expectedPhase === 'npc-intro') return resolveNpcEncounter(current);
        if (expectedPhase === 'event-intro') return resolveEventEncounter(current);
        return current;
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [expedition, expeditionSpeed, playSfx]);

  useEffect(() => {
    if (!expedition || expedition.phase !== 'defeat' || expedition.settled) return;

    const referenceCost = TIMELINE_UPGRADE_RATES[expedition.weaponTier]?.cost
      || TIMELINE_UPGRADE_RATES[Math.max(1, expedition.weaponTier - 1)]?.cost
      || 20;
    const settled = settleExpeditionDefeat(expedition, {
      gold,
      referenceCost,
    });
    const settlementId = settled.settlement?.id;
    if (!settlementId || expeditionSettlementLockRef.current.has(settlementId)) return;
    expeditionSettlementLockRef.current.add(settlementId);

    const nextGold = settled.settlement.goldAfter;
    const nextStats = applyExpeditionSettlement(expeditionStats, settled);
    const nextEconomy = applyExpeditionLootSettlement(expeditionEconomy, settled);

    persistActiveExpedition(settled, onStorageFailure);
    persistExpeditionEconomy(nextEconomy, onStorageFailure);
    try {
      localStorage.setItem('playerGold', String(nextGold));
      localStorage.setItem('weaponExpeditionStatsV1', JSON.stringify(nextStats));
    } catch (error) {
      onStorageFailure?.(error);
    }

    setGold(nextGold);
    setExpeditionStats(nextStats);
    setExpeditionEconomy(nextEconomy);
    setExpedition(settled);
    playSfx('fail');
    addLog(
      settled.settlement.penaltyType === 'weapon-damaged'
        ? `💥 탐사 실패! [${expedition.weaponName}] 긴급 수리비 ${settled.settlement.goldLost}냥을 냈습니다.`
        : `💰 탐사 실패! 쓰러진 사이 ${settled.settlement.goldLost}냥을 빼앗겼습니다.`,
      'error',
    );
  }, [
    addLog,
    expedition,
    expeditionEconomy,
    expeditionStats,
    gold,
    onStorageFailure,
    playSfx,
    setGold,
  ]);

  useEffect(() => {
    if (!expedition?.settled || !expedition.settlement?.id) return;

    if (expeditionStats.lastSettlementId !== expedition.settlement.id) {
      const recoveredStats = applyExpeditionSettlement(expeditionStats, expedition);
      setExpeditionStats(recoveredStats);
      try {
        localStorage.setItem('weaponExpeditionStatsV1', JSON.stringify(recoveredStats));
      } catch (error) {
        onStorageFailure?.(error);
      }
    }

    if (expeditionEconomy.lastLootSettlementId !== expedition.settlement.id) {
      const recoveredEconomy = applyExpeditionLootSettlement(expeditionEconomy, expedition);
      persistExpeditionEconomy(recoveredEconomy, onStorageFailure);
      setExpeditionEconomy(recoveredEconomy);
    }

    if (
      expedition.settlement.kind === 'defeat'
      && Number.isFinite(expedition.settlement.goldAfter)
      && gold !== expedition.settlement.goldAfter
    ) {
      setGold(expedition.settlement.goldAfter);
    }
  }, [
    expedition,
    expeditionEconomy,
    expeditionStats,
    gold,
    onStorageFailure,
    setGold,
  ]);

  const handleBuyExpeditionSupply = useCallback((supplyId) => {
    if (expedition || isEnhancing || outcome) return;

    expeditionEconomyTransactionRef.current += 1;
    const transactionId = `supply-buy:${Date.now()}:${expeditionEconomyTransactionRef.current}`;
    const purchased = purchaseExpeditionSupply(expeditionEconomy, {
      supplyId,
      gold,
      transactionId,
    });

    if (purchased.result !== 'purchased') {
      const message = purchased.result === 'insufficient-gold'
        ? '준비물을 만들 엽전이 부족합니다. 퀴즈를 풀어 엽전을 모아 보세요.'
        : purchased.result === 'insufficient-loot'
          ? '필요한 전리품이 부족합니다. 탐사에서 재료를 안전하게 가져오세요.'
          : purchased.result === 'stack-full'
            ? '이 준비물은 이미 최대로 보유하고 있습니다.'
            : '준비물을 만들 수 없습니다. 저장 데이터를 확인해 주세요.';
      playSfx('wrong');
      addLog(`🎒 ${message}`, 'warning');
      return;
    }

    persistExpeditionEconomy(purchased.economy, onStorageFailure);
    try {
      localStorage.setItem('playerGold', String(purchased.gold));
    } catch (error) {
      onStorageFailure?.(error);
    }

    setExpeditionEconomy(purchased.economy);
    setGold(purchased.gold);
    playSfx('success');
    addLog(`🎒 [${purchased.supply.name}]을 만들어 다음 탐사 준비소에 보관했습니다.`, 'success');
  }, [
    addLog,
    expedition,
    expeditionEconomy,
    gold,
    isEnhancing,
    onStorageFailure,
    outcome,
    playSfx,
    setGold,
  ]);

  const handleEquipExpeditionSupply = useCallback((supplyId) => {
    if (expedition || isEnhancing || outcome) return;

    const equipped = equipExpeditionSupply(expeditionEconomy, { supplyId });
    if (equipped.result !== 'equipped') {
      if (equipped.result !== 'already-equipped') {
        playSfx('wrong');
        addLog('먼저 전리품과 엽전으로 준비물을 만들어야 합니다.', 'warning');
      }
      return;
    }

    persistExpeditionEconomy(equipped.economy, onStorageFailure);
    setExpeditionEconomy(equipped.economy);
    playSfx('page');
    addLog(`🎒 [${equipped.supply.name}]을 다음 탐사 준비물로 장착했습니다.`, 'info');
  }, [
    addLog,
    expedition,
    expeditionEconomy,
    isEnhancing,
    onStorageFailure,
    outcome,
    playSfx,
  ]);

  const toggleExpeditionSpeed = useCallback(() => {
    setExpeditionSpeed(current => current === 1 ? 2 : 1);
  }, []);

  const storedExpeditionLootTotal = Object.values(expeditionEconomy.lootInventory)
    .reduce((sum, count) => sum + count, 0);
  const equippedExpeditionSupply = getExpeditionSupply(expeditionEconomy.equippedSupplyId);

  return {
    expedition,
    expeditionSpeed,
    expeditionStats,
    expeditionEconomy,
    storedExpeditionLootTotal,
    equippedExpeditionSupply,
    flushActiveExpedition,
    handleUnlockHistoryCard,
    openExpedition,
    handleContinueExpedition,
    handleReturnExpedition,
    handleCloseExpedition,
    handleBuyExpeditionSupply,
    handleEquipExpeditionSupply,
    toggleExpeditionSpeed,
  };
}
