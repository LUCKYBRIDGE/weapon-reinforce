import { useEffect, useRef, useState } from 'react';
import { MAX_GAME_SAVE_BYTES, parseGameSave } from '../data/gameSave.js';

const formatBytes = bytes => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0KB';
  return `${Math.max(1, Math.ceil(bytes / 1024))}KB`;
};

export default function SaveManagerModal({ summary, onClose, onExport, onImport }) {
  const closeButtonRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [status, setStatus] = useState({ tone: 'info', text: '현재 브라우저에 자동 저장되고 있습니다.' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onClose]);

  const handleExport = () => {
    try {
      const result = onExport();
      setStatus({ tone: 'success', text: result || '저장 데이터 파일을 만들었습니다.' });
    } catch (error) {
      setStatus({ tone: 'error', text: error?.message || '저장 데이터 파일을 만들지 못했습니다.' });
    }
  };

  const handleFileChange = async event => {
    const file = event.target.files?.[0];
    setSelectedFile(null);
    setSelectedText('');
    if (!file) return;
    if (file.size > MAX_GAME_SAVE_BYTES) {
      setStatus({ tone: 'error', text: '1MB 이하의 무기 강화 저장 데이터 파일만 불러올 수 있습니다.' });
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      parseGameSave(text);
      setSelectedFile(file);
      setSelectedText(text);
      setStatus({
        tone: 'warning',
        text: '정상 저장 데이터 파일임을 확인했습니다. 아래 버튼을 누르면 현재 브라우저 진행을 이 파일로 바꿉니다.',
      });
    } catch (error) {
      setStatus({ tone: 'error', text: error?.message || '선택한 파일을 읽거나 검증하지 못했습니다.' });
      event.target.value = '';
    }
  };

  const handleImport = async () => {
    if (!selectedText || busy) return;
    setBusy(true);
    try {
      await onImport(selectedText);
    } catch (error) {
      setStatus({ tone: 'error', text: error?.message || '저장 데이터 파일을 불러오지 못했습니다.' });
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay save-manager-overlay">
      <section
        className="modal-content glass-panel save-manager-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-manager-title"
      >
        <button ref={closeButtonRef} className="close-btn" type="button" onClick={onClose} disabled={busy}>✕</button>
        <header className="save-manager-heading">
          <span>기본 저장 · 현재 브라우저</span>
          <h2 id="save-manager-title">💾 자동 저장과 파일 백업</h2>
          <p>게임은 이 브라우저에 자동 저장됩니다. 더 확실히 보관하거나 다른 기기로 옮길 때만 저장 데이터 파일을 만드세요.</p>
        </header>

        <div className="save-manager-current" aria-label="현재 저장 요약">
          <div><span>현재 무기</span><strong>+{summary.tier} {summary.weaponName}</strong></div>
          <div><span>보유 엽전</span><strong>{summary.gold.toLocaleString()}냥</strong></div>
          <div><span>탐사 상태</span><strong>{summary.activeExpeditionLabel}</strong></div>
        </div>

        <p className={`save-manager-status is-${status.tone}`} role="status" aria-live="polite">{status.text}</p>

        <div className="save-manager-actions">
          <article>
            <div>
              <span>선택 백업</span>
              <h3>저장 데이터 파일 만들기</h3>
              <p>현재 무기, 엽전, 퀴즈 기록, 도감, 탐사 기록을 기기에 저장할 한 파일로 만듭니다.</p>
            </div>
            <button type="button" className="save-export-btn" onClick={handleExport}>저장 데이터 파일 내려받기</button>
          </article>

          <article>
            <div>
              <span>선택 복구</span>
              <h3>저장 데이터 파일 불러오기</h3>
              <p>파일이 정상인지 확인한 뒤 현재 브라우저 진행을 교체합니다.</p>
            </div>
            <input
              ref={fileInputRef}
              className="save-file-input"
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              disabled={busy}
            />
            <button type="button" className="save-file-pick-btn" onClick={() => fileInputRef.current?.click()} disabled={busy}>
              파일 선택
            </button>
            {selectedFile && (
              <div className="save-file-selected">
                <strong>{selectedFile.name}</strong>
                <span>{formatBytes(selectedFile.size)}</span>
              </div>
            )}
            <button
              type="button"
              className="save-import-btn"
              onClick={handleImport}
              disabled={!selectedText || busy}
            >
              {busy ? '불러오는 중…' : '현재 진행을 이 파일로 바꾸기'}
            </button>
          </article>
        </div>

        <aside className="save-manager-notice">
          <strong>기억해 주세요</strong>
          <p>평소에는 자동 저장만으로 플레이할 수 있습니다. 브라우저 데이터를 지우거나 기기를 바꿀 계획이 있을 때 저장 데이터 파일을 추가로 보관하세요.</p>
        </aside>
      </section>
    </div>
  );
}
