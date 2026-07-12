import { useEffect, useMemo, useRef, useState } from 'react';
import {
  EXPEDITION_HISTORY_LAYERS,
  getExpeditionRenownRank,
} from '../data/expedition.js';

export default function HistoryArchiveModal({ stats, onUnlock, onClose }) {
  const closeButtonRef = useRef(null);
  const firstAvailable = EXPEDITION_HISTORY_LAYERS.find(card => stats.seenHistoryCardIds.includes(card.id))
    || EXPEDITION_HISTORY_LAYERS[0];
  const [selectedId, setSelectedId] = useState(firstAvailable.id);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const rank = getExpeditionRenownRank(stats.renown);
  const selected = useMemo(
    () => EXPEDITION_HISTORY_LAYERS.find(card => card.id === selectedId) || EXPEDITION_HISTORY_LAYERS[0],
    [selectedId],
  );
  const isSeen = stats.seenHistoryCardIds.includes(selected.id);
  const isUnlocked = stats.unlockedHistoryCardIds.includes(selected.id);
  const canUnlock = isSeen && !isUnlocked && stats.historyFragments >= selected.fragmentCost;

  return (
    <div className="modal-overlay history-archive-overlay">
      <section
        className="modal-content glass-panel history-archive-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-archive-title"
      >
        <button ref={closeButtonRef} className="close-btn" type="button" onClick={onClose}>✕</button>
        <header className="history-archive-heading">
          <div>
            <span>탐사에서 만난 기록은 잃어버리지 않아요</span>
            <h2 id="history-archive-title">📜 시간 기록관</h2>
          </div>
          <div className="history-archive-wallet">
            <span>현재 명성 <strong>{stats.renown.toLocaleString()}</strong></span>
            <span>기록 조각 <strong>{stats.historyFragments}</strong></span>
          </div>
        </header>

        <div className="history-rank-card">
          <span>현재 탐사 등급</span>
          <strong>{rank.name}</strong>
          <p>{rank.description}</p>
        </div>

        {stats.completionUnlocked && (
          <div className="history-completion-card" role="status">
            <span>TIME RIFT COMPLETE</span>
            <strong>시간 균열 봉합 기록</strong>
            <p>+7 비파형동검을 들고 일곱 역사층을 지나 안전하게 돌아왔습니다.</p>
          </div>
        )}

        <div className="history-archive-layout">
          <nav className="history-card-list" aria-label="역사 카드 목록">
            {EXPEDITION_HISTORY_LAYERS.map(card => {
              const seen = stats.seenHistoryCardIds.includes(card.id);
              const unlocked = stats.unlockedHistoryCardIds.includes(card.id);
              return (
                <button
                  key={card.id}
                  type="button"
                  className={`${selected.id === card.id ? 'active' : ''} ${seen ? 'seen' : 'unseen'}`}
                  onClick={() => setSelectedId(card.id)}
                  aria-current={selected.id === card.id ? 'true' : undefined}
                >
                  <span>{seen ? unlocked ? '📖' : '🧩' : '🔒'} {card.depth}층</span>
                  <strong>{seen ? card.weaponName : '아직 만나지 못한 기록'}</strong>
                </button>
              );
            })}
          </nav>

          <article className={`history-card-detail ${isSeen ? 'is-seen' : 'is-unseen'}`}>
            {!isSeen ? (
              <div className="history-card-locked">
                <span>🔒</span>
                <h3>{selected.depth}층 기록은 아직 안개 속에 있습니다.</h3>
                <p>탐사에서 이 역사층의 적·NPC·사건을 만나면 짧은 기록이 남습니다.</p>
              </div>
            ) : (
              <>
                <div className="history-card-title-row">
                  <img src={`${import.meta.env.BASE_URL}images/${selected.image}`} alt={selected.weaponName} />
                  <div>
                    <span>{selected.title}</span>
                    <h3>{selected.weaponName}</h3>
                    <p>{selected.era} · {selected.yearLabel}</p>
                  </div>
                </div>
                <p className="history-card-short-fact">{selected.shortFact}</p>

                {!isUnlocked ? (
                  <div className="history-card-restore">
                    <strong>기록 조각으로 자세한 기록 복원</strong>
                    <p>필요한 조각 {selected.fragmentCost}개 · 보유 {stats.historyFragments}개</p>
                    <button type="button" onClick={() => onUnlock(selected.id)} disabled={!canUnlock}>
                      {canUnlock ? `조각 ${selected.fragmentCost}개로 복원` : '기록 조각이 부족합니다'}
                    </button>
                  </div>
                ) : (
                  <div className="history-card-expanded">
                    <div>
                      <span>확인한 역사 정보</span>
                      <p>{selected.fullFact}</p>
                      <small>{selected.certainty}</small>
                    </div>
                    <div className="history-think-question">
                      <span>생각해 보기</span>
                      <p>{selected.thinkQuestion}</p>
                    </div>
                    <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                      공식 참고 자료 보기 · {selected.sourceTitle}
                    </a>
                  </div>
                )}
              </>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
