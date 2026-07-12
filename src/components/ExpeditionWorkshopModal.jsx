import { useEffect, useRef } from 'react';

import { QUIZ_REFERENCE_REWARD } from '../data/quizCatalog.js';
import {
  EXPEDITION_LOOT_ITEMS,
  EXPEDITION_SUPPLIES,
  getExpeditionLootItem,
} from '../data/expeditionEconomy.js';
import {
  RESTORE_SHOP_PRICES,
  WEAPON_TIMELINE,
} from '../data/weaponTimeline.js';

const getImageUrl = fileName => `${import.meta.env.BASE_URL}images/${fileName}`;

const SupplyCost = ({ supply, economy }) => (
  <div className="expedition-workshop-cost" aria-label={`${supply.name} 교환 비용`}>
    <span>{supply.cost.gold.toLocaleString()}냥</span>
    {Object.entries(supply.cost.loot).map(([itemId, count]) => {
      const item = getExpeditionLootItem(itemId);
      return (
        <span key={itemId} className={(economy.lootInventory[itemId] || 0) < count ? 'is-missing' : ''}>
          {item?.icon} {item?.name || itemId} {count}개
        </span>
      );
    })}
  </div>
);

export default function ExpeditionWorkshopModal({
  economy,
  gold,
  currentTier,
  currentWeaponName,
  maxRestorableTier,
  onBuySupply,
  onEquipSupply,
  onRestorePurchase,
  onClose,
}) {
  const closeButtonRef = useRef(null);
  const safeGold = Math.max(0, Math.trunc(Number(gold) || 0));
  const safeTier = Math.max(1, Math.min(7, Math.trunc(Number(currentTier) || 1)));
  const safeMaxRestorableTier = Math.max(1, Math.min(5, Math.trunc(Number(maxRestorableTier) || 1)));

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay expedition-workshop-overlay"
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal-content glass-panel expedition-workshop-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expedition-workshop-title"
      >
        <button ref={closeButtonRef} className="close-btn" type="button" onClick={onClose} aria-label="탐사 준비소 닫기">
          ✕
        </button>

        <header className="expedition-workshop-heading">
          <div>
            <span>전리품은 팔지 않고 다음 탐사를 준비하는 데 사용해요</span>
            <h2 id="expedition-workshop-title">🎒 탐사 준비소</h2>
          </div>
          <div className="expedition-workshop-wallet">
            <span>보유 엽전 <strong>{safeGold.toLocaleString()}냥</strong></span>
            <span>현재 무기 <strong>+{safeTier} {currentWeaponName}</strong></span>
          </div>
        </header>

        <section className="expedition-workshop-section supply-workshop-section" aria-labelledby="supply-workshop-title">
          <div className="expedition-workshop-section-heading">
            <span>한 탐사에 하나만 장착</span>
            <h3 id="supply-workshop-title">다음 탐사 준비물</h3>
          </div>
          <div className="expedition-supply-grid">
            {EXPEDITION_SUPPLIES.map(supply => {
              const owned = economy.supplies[supply.id] || 0;
              const isEquipped = economy.equippedSupplyId === supply.id;
              const hasLoot = Object.entries(supply.cost.loot)
                .every(([itemId, count]) => (economy.lootInventory[itemId] || 0) >= count);
              const canBuy = safeGold >= supply.cost.gold && hasLoot && owned < supply.stackLimit;
              return (
                <article key={supply.id} className={`expedition-supply-card ${isEquipped ? 'is-equipped' : ''}`}>
                  <div className="expedition-supply-title">
                    <span aria-hidden="true">{supply.icon}</span>
                    <div>
                      <h4>{supply.name}</h4>
                      <p>{supply.effectDescription}</p>
                    </div>
                  </div>
                  <p className="expedition-supply-owned">보유 {owned}/{supply.stackLimit}개</p>
                  <SupplyCost supply={supply} economy={economy} />
                  <div className="expedition-supply-actions">
                    <button type="button" onClick={() => onBuySupply(supply.id)} disabled={!canBuy}>
                      {owned >= supply.stackLimit ? '가득 보유 중' : !hasLoot ? '재료 부족' : safeGold < supply.cost.gold ? '엽전 부족' : '준비물 만들기'}
                    </button>
                    <button
                      type="button"
                      className="expedition-supply-equip-btn"
                      onClick={() => onEquipSupply(supply.id)}
                      disabled={owned <= 0 || isEquipped}
                    >
                      {isEquipped ? '장착 중' : owned > 0 ? '다음 탐사에 장착' : '먼저 만들어야 해요'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="expedition-workshop-section loot-warehouse-section" aria-labelledby="loot-warehouse-title">
          <div className="expedition-workshop-section-heading">
            <span>엽전으로 판매하지 않는 게임 속 가상 재료</span>
            <h3 id="loot-warehouse-title">전리품 창고</h3>
          </div>
          <div className="expedition-loot-warehouse-grid">
            {EXPEDITION_LOOT_ITEMS.map(item => {
              const owned = economy.lootInventory[item.id] || 0;
              const discovered = economy.lootDiscovered[item.id] || 0;
              return (
                <article key={item.id} className={`expedition-loot-warehouse-card ${discovered ? 'is-discovered' : 'is-undiscovered'}`}>
                  <span className="expedition-loot-icon" aria-hidden="true">{discovered ? item.icon : '❔'}</span>
                  <div>
                    <h4>{discovered ? item.name : '아직 만나지 못한 재료'}</h4>
                    <p>{discovered ? item.description : '탐사에서 발견한 뒤 안전하게 돌아오면 창고에 보관됩니다.'}</p>
                    {discovered > 0 && <small>{item.usage}</small>}
                  </div>
                  <strong>보유 {owned}개</strong>
                </article>
              );
            })}
          </div>
          <p className="expedition-loot-no-sale-note">
            전리품은 엽전으로 팔 수 없습니다. 엽전의 기본 수입원은 퀴즈이며, 전리품은 준비물 교환에만 사용합니다.
          </p>
        </section>

        <section className="expedition-workshop-section restore-workshop-section" aria-labelledby="restore-workshop-title">
          <div className="expedition-workshop-section-heading">
            <span>성공했던 역사층의 제작 기록</span>
            <h3 id="restore-workshop-title">복원 무기고</h3>
          </div>
          <p className="restore-workshop-rule">
            평생 최고 성공 단계보다 2단계 낮은 무기까지만 복원할 수 있습니다. 구매한 무기는 창고에 쌓이지 않고 즉시 현재 무기가 됩니다.
          </p>
          <div className="expedition-restore-grid">
            {Object.keys(RESTORE_SHOP_PRICES)
              .map(Number)
              .filter(targetTier => targetTier >= 2)
              .map(targetTier => {
                const weapon = WEAPON_TIMELINE[targetTier];
                const price = RESTORE_SHOP_PRICES[targetTier];
                const isRecordLocked = targetTier > safeMaxRestorableTier;
                const isCurrentOrLower = targetTier <= safeTier;
                const canAfford = safeGold >= price;
                return (
                  <article key={targetTier} className={`expedition-restore-card ${isRecordLocked ? 'is-locked' : ''}`}>
                    <img src={getImageUrl(weapon.image)} alt={weapon.name} />
                    <div>
                      <span>+{targetTier} · {weapon.yearLabel}</span>
                      <h4>{weapon.name}</h4>
                      <p>{weapon.era} · {weapon.role}</p>
                    </div>
                    <div className="expedition-restore-buy">
                      <strong>{price.toLocaleString()}냥</strong>
                      <small>퀴즈 정답 평균 약 {Math.ceil(price / QUIZ_REFERENCE_REWARD)}개</small>
                      <button
                        type="button"
                        onClick={() => onRestorePurchase(targetTier)}
                        disabled={isRecordLocked || isCurrentOrLower || !canAfford}
                      >
                        {isRecordLocked
                          ? `평생 최고 +${targetTier + 2} 필요`
                          : isCurrentOrLower
                            ? '현재 이하 단계'
                            : !canAfford
                              ? '엽전 부족'
                              : '즉시 복원'}
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      </section>
    </div>
  );
}
