import { useCallback, useState } from 'react';
import {
  exportGameSave,
  getBrowserGameStorage,
  importGameSave,
} from '../data/gameSave.js';

const isStorageQuotaError = error => (
  error?.name === 'QuotaExceededError'
  || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  || error?.code === 22
  || error?.code === 1014
);

export default function useGameStorage({ playSfx, addLog }) {
  const [storageSaveFailure, setStorageSaveFailure] = useState(null);
  const [showSaveManagerModal, setShowSaveManagerModal] = useState(false);

  const reportStorageSaveFailure = useCallback((error) => {
    const quotaExceeded = isStorageQuotaError(error);
    setStorageSaveFailure(current => current || {
      kind: quotaExceeded ? 'quota' : 'blocked',
      title: quotaExceeded ? '자동 저장 공간이 부족합니다.' : '브라우저 자동 저장이 차단되었습니다.',
      message: quotaExceeded
        ? '이 기기의 브라우저 저장 공간을 정리한 뒤 저장을 다시 확인해 주세요.'
        : '시크릿 모드나 브라우저 설정에서 이 사이트의 저장이 허용되어 있는지 확인해 주세요.',
    });
  }, []);

  const openSaveManager = useCallback(() => {
    setShowSaveManagerModal(true);
  }, []);

  const closeSaveManager = useCallback(() => {
    setShowSaveManagerModal(false);
  }, []);

  const exportGameSaveFile = useCallback(({ beforeExport } = {}) => {
    let text;

    try {
      beforeExport?.();
      const storage = getBrowserGameStorage();
      text = exportGameSave(storage);
    } catch (error) {
      if (['STORAGE_UNAVAILABLE', 'STORAGE_WRITE_FAILED'].includes(error?.code)) {
        reportStorageSaveFailure(error);
      }
      throw error;
    }

    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    anchor.href = url;
    anchor.download = `weapon-reinforce-save-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    playSfx('success');
    addLog('💾 현재 진행의 저장 데이터 파일을 기기에 보관했습니다.', 'success');
    return '저장 데이터 파일을 내려받았습니다. 기기의 다운로드 목록을 확인하세요.';
  }, [addLog, playSfx, reportStorageSaveFailure]);

  const importGameSaveFile = useCallback(async (text) => {
    try {
      const storage = getBrowserGameStorage();
      importGameSave(storage, text);
    } catch (error) {
      if (['STORAGE_UNAVAILABLE', 'STORAGE_WRITE_FAILED'].includes(error?.code)) {
        reportStorageSaveFailure(error);
      }
      throw error;
    }

    playSfx('success');
    window.location.reload();
  }, [playSfx, reportStorageSaveFailure]);

  return {
    storageSaveFailure,
    showSaveManagerModal,
    reportStorageSaveFailure,
    openSaveManager,
    closeSaveManager,
    exportGameSaveFile,
    importGameSaveFile,
  };
}
