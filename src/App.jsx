import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CURIOSITIES,
  CURIOSITY_RARITIES,
  getCuriosityMetrics,
  getCuriositySaleImpact,
  RESTORE_SHOP_PRICES,
  TIMELINE_PATH,
  TIMELINE_UPGRADE_RATES,
  TIMING_BONUS,
  TITLE_DEFINITIONS,
  WEAPON_TIMELINE,
} from './data/weaponTimeline.js';
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
} from './data/expedition.js';
import {
  getQuizPack,
  getQuizReward,
  isQuizImageAsset,
  QUIZ_PACKS,
  QUIZ_TOTAL_QUESTION_COUNT,
  resolveQuizAssetUrl,
} from './data/quizCatalog.js';
import {
  applyExpeditionLootSettlement,
  consumeEquippedExpeditionSupply,
  equipExpeditionSupply,
  getExpeditionSupply,
  purchaseExpeditionSupply,
  sanitizeExpeditionEconomy,
} from './data/expeditionEconomy.js';
import {
  readStoredArray,
  readStoredNumber,
  readStoredObject,
  readStoredString,
  sanitizeCountRecord,
} from './data/safeStorage.js';
import {
  exportGameSave,
  getBrowserGameStorage,
  importGameSave,
} from './data/gameSave.js';
import ExpeditionModal from './components/ExpeditionModal.jsx';
import ExpeditionWorkshopModal from './components/ExpeditionWorkshopModal.jsx';
import HistoryArchiveModal from './components/HistoryArchiveModal.jsx';
import SaveManagerModal from './components/SaveManagerModal.jsx';
import useQuizSession from './hooks/useQuizSession.js';
import useEnhancementSession from './hooks/useEnhancementSession.js';

const SHOW_DEV_TOOLS = import.meta.env.DEV
  && typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('debug') === '1';

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


const WEAPON_TREE = {
  common: { 1: WEAPON_TIMELINE[1] },
  [TIMELINE_PATH]: Object.fromEntries(
    Object.entries(WEAPON_TIMELINE).filter(([tier]) => Number(tier) > 1)
  ),
};

const UPGRADE_RATES = TIMELINE_UPGRADE_RATES;

const MAX_WEAPON_TIER = 7;
const GREAT_SUCCESS_DOUBLE_RATE = 3;
const GREAT_SUCCESS_TRIPLE_RATE = 1;
const GREAT_SUCCESS_FALSE_ALARM_RATE = 4;
const TEST_ENHANCEMENT_SCENARIOS = [
  { id: 'success-v1', label: '+1강화v1', requiredSteps: 1 },
  { id: 'success-v2', label: '+1강화v2', requiredSteps: 1 },
  { id: 'fail-v1', label: '강화실패v1', requiredSteps: 1 },
  { id: 'fail-v2', label: '강화실패v2', requiredSteps: 1 },
  { id: 'great-2', label: '+2대강화', requiredSteps: 2 },
  { id: 'great-3', label: '+3대강화', requiredSteps: 3 },
];
const getAssetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
const getImageUrl = (fileName) => getAssetUrl(`images/${fileName}`);
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

const isStorageQuotaError = error => (
  error?.name === 'QuotaExceededError'
  || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  || error?.code === 22
  || error?.code === 1014
);
const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
const chromaKeyImageCache = new Map();

const getViewportMode = () => {
  if (typeof window === 'undefined') return '웹/전자칠판';

  const width = window.innerWidth;
  if (width <= 640) return '모바일';
  if (width <= 1024) return '태블릿';
  return '웹/전자칠판';
};

const VIEW_MODES = ['모바일', '태블릿', '웹/전자칠판'];
const VIEW_MODE_CLASS = {
  모바일: 'mobile',
  태블릿: 'tablet',
  '웹/전자칠판': 'board',
};
const WEAPON_PATHS = [TIMELINE_PATH];

const isWeaponPath = (targetPath) => WEAPON_PATHS.includes(targetPath);

const normalizeWeaponState = (targetTier, targetPath, fallbackPath = TIMELINE_PATH) => {
  const parsedTier = Number.parseInt(targetTier, 10);
  const safeTier = Number.isFinite(parsedTier)
    ? Math.max(1, Math.min(MAX_WEAPON_TIER, parsedTier))
    : 1;

  if (safeTier <= 1) {
    return { tier: 1, path: null };
  }

  const safePath = isWeaponPath(targetPath)
    ? targetPath
    : isWeaponPath(fallbackPath)
      ? fallbackPath
      : TIMELINE_PATH;

  if (WEAPON_TREE[safePath]?.[safeTier]) {
    return { tier: safeTier, path: safePath };
  }

  return { tier: 1, path: null };
};

const getWeaponNameByState = (targetTier, targetPath) => {
  const weaponState = normalizeWeaponState(targetTier, targetPath);
  if (weaponState.tier === 1) return WEAPON_TREE.common[1].name;
  return WEAPON_TREE[weaponState.path][weaponState.tier].name;
};

const getWeaponImageFileName = (targetTier, targetPath) => {
  const weaponState = normalizeWeaponState(targetTier, targetPath);
  return WEAPON_TIMELINE[weaponState.tier]?.image || WEAPON_TIMELINE[1].image;
};

const getGreatSuccessStepCount = (currentTier) => {
  const maxSteps = Math.min(3, MAX_WEAPON_TIER - currentTier);
  if (maxSteps <= 1) return 1;

  const roll = Math.random() * 100;
  if (maxSteps >= 3) {
    if (roll < GREAT_SUCCESS_TRIPLE_RATE) return 3;
    if (roll < GREAT_SUCCESS_TRIPLE_RATE + GREAT_SUCCESS_DOUBLE_RATE) return 2;
    return 1;
  }
  if (roll < GREAT_SUCCESS_DOUBLE_RATE) return 2;
  return 1;
};

const getRandomDelay = (base, variance) => base + Math.floor(Math.random() * variance);

const getMidnightNews = (maxTier) => {
  const weapon = WEAPON_TIMELINE[Math.max(1, Math.min(MAX_WEAPON_TIER, maxTier))];
  const dateStr = `시간역행 대장간 · 오늘의 복원 기록`;
  const title = maxTier >= MAX_WEAPON_TIER
    ? `가장 오래된 역사층 도달, ${weapon.name} 복원!`
    : `${weapon.yearLabel}, ${weapon.name}까지 시간을 되감다`;
  const body = `${weapon.era}의 ${weapon.name}이 오늘의 최고 복원 기록으로 남았다. ${weapon.fact} 게임 속에서는 오래된 무기일수록 더 강한 역사 공명을 품는다는 설정을 사용하며, 실제 무기의 우열을 뜻하지 않는다.`;

  return { dateStr, title, body };
};


const ChromaKeyImage = ({ src, alt, className = "", style = {}, onError = null }) => {
  const [processedSrc, setProcessedSrc] = useState(() => chromaKeyImageCache.get(src) || '');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setHasError(false);

    if (!src) {
      setProcessedSrc('');
      return () => {
        cancelled = true;
      };
    }

    const cachedSrc = chromaKeyImageCache.get(src);
    if (cachedSrc) {
      setProcessedSrc(cachedSrc);
      return () => {
        cancelled = true;
      };
    }

    setProcessedSrc('');

    const img = new Image();
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const { width, height } = canvas;
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const cornerOffsets = [
          0,
          (width - 1) * 4,
          (height - 1) * width * 4,
          (height * width - 1) * 4,
        ];
        const seeds = cornerOffsets.map(offset => [data[offset], data[offset + 1], data[offset + 2]]);
        const toleranceSq = 42 * 42;
        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        let head = 0;
        let tail = 0;

        const isBackground = (pixelIndex) => {
          const offset = pixelIndex * 4;
          if (data[offset + 3] === 0) return false;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          return seeds.some(([sr, sg, sb]) => {
            const dr = r - sr;
            const dg = g - sg;
            const db = b - sb;
            return dr * dr + dg * dg + db * db <= toleranceSq;
          });
        };

        const enqueue = (pixelIndex) => {
          if (visited[pixelIndex] || !isBackground(pixelIndex)) return;
          visited[pixelIndex] = 1;
          queue[tail] = pixelIndex;
          tail += 1;
        };

        for (let x = 0; x < width; x += 1) {
          enqueue(x);
          enqueue((height - 1) * width + x);
        }
        for (let y = 0; y < height; y += 1) {
          enqueue(y * width);
          enqueue(y * width + width - 1);
        }

        while (head < tail) {
          const pixelIndex = queue[head];
          head += 1;
          data[pixelIndex * 4 + 3] = 0;

          const x = pixelIndex % width;
          const y = Math.floor(pixelIndex / width);
          if (x > 0) enqueue(pixelIndex - 1);
          if (x + 1 < width) enqueue(pixelIndex + 1);
          if (y > 0) enqueue(pixelIndex - width);
          if (y + 1 < height) enqueue(pixelIndex + width);
        }

        ctx.putImageData(imgData, 0, 0);
        const nextProcessedSrc = canvas.toDataURL('image/png');
        chromaKeyImageCache.set(src, nextProcessedSrc);
        if (!cancelled) {
          setProcessedSrc(nextProcessedSrc);
        }
      } catch {
        chromaKeyImageCache.set(src, src);
        if (!cancelled) {
          setProcessedSrc(src);
        }
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setHasError(true);
        if (onError) onError();
      }
    };

    return () => {
      cancelled = true;
    };
  }, [src, onError]);

  if (hasError) {
    return <div className="image-fallback">⚠️</div>;
  }

  return (
    <img
      src={processedSrc || TRANSPARENT_PIXEL}
      alt={alt}
      className={className}
      style={{ ...style, opacity: processedSrc ? 1 : 0, transition: 'opacity 0.16s ease-out' }}
    />
  );
};

const WeaponImage = ({ path, tier, name, className = "weapon-image" }) => {
  const [hasError, setHasError] = useState(false);

  const weaponState = normalizeWeaponState(tier, path);
  const src = getImageUrl(getWeaponImageFileName(weaponState.tier, weaponState.path));
  const handleError = useCallback(() => setHasError(true), []);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div className="weapon-fallback">
        {weaponState.tier === 1 ? '🔫' : '⚔️'}
      </div>
    );
  }

  return (
    <ChromaKeyImage
      src={src}
      alt={name}
      className={className}
      onError={handleError}
    />
  );
};

let sharedAudioContext = null;

const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextClass();
  }

  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }

  return sharedAudioContext;
};

const playTone = (ctx, { freq, duration, type = 'sine', start = 0, volume = 0.08, bendTo = null }) => {
  const now = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (bendTo) {
    osc.frequency.exponentialRampToValueAtTime(bendTo, now + duration);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.03);
};

const playNoise = (ctx, { duration = 0.12, start = 0, volume = 0.04, filterFreq = 900 }) => {
  const now = ctx.currentTime + start;
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(filterFreq, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
  source.stop(now + duration + 0.02);
};

const playSoundEffect = (name, enabled) => {
  if (!enabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (name === 'hammer') {
    playNoise(ctx, { duration: 0.1, volume: 0.06, filterFreq: 1400 });
    playTone(ctx, { freq: 180, bendTo: 95, duration: 0.12, type: 'square', volume: 0.045 });
    playTone(ctx, { freq: 760, bendTo: 420, duration: 0.08, type: 'triangle', volume: 0.035 });
  } else if (name === 'coin') {
    playTone(ctx, { freq: 880, duration: 0.07, type: 'triangle', volume: 0.04 });
    playTone(ctx, { freq: 1320, duration: 0.08, type: 'triangle', start: 0.06, volume: 0.035 });
  } else if (name === 'success') {
    playTone(ctx, { freq: 523, duration: 0.09, type: 'triangle', volume: 0.05 });
    playTone(ctx, { freq: 659, duration: 0.09, type: 'triangle', start: 0.08, volume: 0.05 });
    playTone(ctx, { freq: 784, duration: 0.16, type: 'triangle', start: 0.16, volume: 0.055 });
  } else if (name === 'tension') {
    playTone(ctx, { freq: 196, bendTo: 330, duration: 0.42, type: 'triangle', volume: 0.026 });
    playTone(ctx, { freq: 247, bendTo: 415, duration: 0.42, type: 'sine', start: 0.16, volume: 0.022 });
    playNoise(ctx, { duration: 0.5, start: 0.04, volume: 0.012, filterFreq: 1500 });
  } else if (name === 'near-success') {
    playTone(ctx, { freq: 659, duration: 0.11, type: 'triangle', volume: 0.036 });
    playTone(ctx, { freq: 784, duration: 0.14, type: 'triangle', start: 0.1, volume: 0.038 });
    playTone(ctx, { freq: 988, duration: 0.18, type: 'sine', start: 0.2, volume: 0.03 });
  } else if (name === 'fail') {
    playNoise(ctx, { duration: 0.22, volume: 0.055, filterFreq: 360 });
    playTone(ctx, { freq: 180, bendTo: 82, duration: 0.24, type: 'sawtooth', volume: 0.04 });
  } else if (name === 'crack') {
    playNoise(ctx, { duration: 0.08, volume: 0.05, filterFreq: 2400 });
    playTone(ctx, { freq: 1180, bendTo: 520, duration: 0.12, type: 'triangle', volume: 0.032 });
  } else if (name === 'shatter') {
    playNoise(ctx, { duration: 0.08, volume: 0.07, filterFreq: 2600 });
    playNoise(ctx, { duration: 0.16, start: 0.06, volume: 0.06, filterFreq: 900 });
    playNoise(ctx, { duration: 0.24, start: 0.14, volume: 0.045, filterFreq: 420 });
    playTone(ctx, { freq: 980, bendTo: 220, duration: 0.2, type: 'triangle', start: 0.02, volume: 0.04 });
    playTone(ctx, { freq: 196, bendTo: 73, duration: 0.34, type: 'sawtooth', start: 0.08, volume: 0.035 });
  } else if (name === 'page') {
    playNoise(ctx, { duration: 0.08, volume: 0.025, filterFreq: 1800 });
    playTone(ctx, { freq: 440, duration: 0.05, type: 'triangle', volume: 0.025 });
  } else if (name === 'wrong') {
    playTone(ctx, { freq: 220, bendTo: 146, duration: 0.16, type: 'sawtooth', volume: 0.035 });
  } else if (name === 'shot') {
    playNoise(ctx, { duration: 0.08, volume: 0.07, filterFreq: 1800 });
    playTone(ctx, { freq: 170, bendTo: 72, duration: 0.13, type: 'square', volume: 0.05 });
  } else if (name === 'swing') {
    playNoise(ctx, { duration: 0.18, volume: 0.035, filterFreq: 2200 });
    playTone(ctx, { freq: 520, bendTo: 170, duration: 0.16, type: 'triangle', volume: 0.035 });
  } else if (name === 'hit') {
    playNoise(ctx, { duration: 0.12, volume: 0.055, filterFreq: 520 });
    playTone(ctx, { freq: 130, bendTo: 78, duration: 0.16, type: 'square', volume: 0.04 });
  }
};

function App() {
  const [gold, setGold] = useState(() => readStoredNumber('playerGold', 0, { min: 0, max: 999_999_999 }));
  const [tier, setTier] = useState(() => readStoredNumber('playerTier', 1, { min: 1, max: MAX_WEAPON_TIER }));
  const [path, setPath] = useState(() => {
    const savedTier = readStoredNumber('playerTier', 1, { min: 1, max: MAX_WEAPON_TIER });
    return savedTier > 1 ? TIMELINE_PATH : null;
  });
  const [logs, setLogs] = useState([]);
  const [viewportMode, setViewportMode] = useState(getViewportMode);
  const [isViewportModeManual, setIsViewportModeManual] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => {
    try {
      return Boolean(document.fullscreenElement);
    } catch {
      return false;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState(() => readStoredString('soundEnabled', 'true', ['true', 'false']) !== 'false');
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
  const [curiosityDrop, setCuriosityDrop] = useState(null);
  const [pendingCuriositySale, setPendingCuriositySale] = useState(null);
  const [storageSaveFailure, setStorageSaveFailure] = useState(null);

  // Cross-system overlay animation state
  const [floatingTexts, setFloatingTexts] = useState([]);
  const expeditionRunCounterRef = useRef(0);
  const expeditionSettlementLockRef = useRef(new Set());
  const expeditionEconomyTransactionRef = useRef(0);

  const reportStorageSaveFailure = useCallback(error => {
    const quotaExceeded = isStorageQuotaError(error);
    setStorageSaveFailure(current => current || {
      kind: quotaExceeded ? 'quota' : 'blocked',
      title: quotaExceeded ? '자동 저장 공간이 부족합니다.' : '브라우저 자동 저장이 차단되었습니다.',
      message: quotaExceeded
        ? '이 기기의 브라우저 저장 공간을 정리한 뒤 저장을 다시 확인해 주세요.'
        : '시크릿 모드나 브라우저 설정에서 이 사이트의 저장이 허용되어 있는지 확인해 주세요.',
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!isViewportModeManual) {
        setViewportMode(getViewportMode());
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isViewportModeManual]);

  useEffect(() => {
    document.documentElement.dataset.displayMode = VIEW_MODE_CLASS[viewportMode] || 'board';
  }, [viewportMode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const [unlockedWeapons, setUnlockedWeapons] = useState(() => {
    const parsed = readStoredArray('unlockedWeapons', ['common_1']);
    const unlockedTiers = new Set([1]);
    parsed.forEach(key => {
      const tierMatch = String(key).match(/_(\d+)$/);
      const parsedTier = tierMatch ? Number(tierMatch[1]) : 0;
      if (parsedTier >= 1 && parsedTier <= MAX_WEAPON_TIER) unlockedTiers.add(parsedTier);
    });
    return Array.from(unlockedTiers)
      .sort((a, b) => a - b)
      .map(unlockedTier => unlockedTier === 1 ? 'common_1' : `${TIMELINE_PATH}_${unlockedTier}`);
  });

  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showNewspaperModal, setShowNewspaperModal] = useState(false);
  const [showCuriosityModal, setShowCuriosityModal] = useState(false);
  const [showRestoreShopModal, setShowRestoreShopModal] = useState(false);
  const [showHistoryArchiveModal, setShowHistoryArchiveModal] = useState(false);
  const [showSaveManagerModal, setShowSaveManagerModal] = useState(false);
  const [maxTierToday, setMaxTierToday] = useState(() => readStoredNumber('maxTierToday', 1, { min: 1, max: MAX_WEAPON_TIER }));
  const [maxPathToday, setMaxPathToday] = useState(() => {
    const saved = readStoredString('maxPathToday', 'null', ['null', TIMELINE_PATH]);
    return saved === TIMELINE_PATH ? TIMELINE_PATH : null;
  });
  const [selectedGalleryItem, setSelectedGalleryItem] = useState({ key: 'common_1', item: WEAPON_TREE.common[1], path: 'common', tier: 1 });
  const [maxTierEver, setMaxTierEver] = useState(() => {
    const saved = readStoredNumber('maxTierEver', 1, { min: 1, max: MAX_WEAPON_TIER });
    const legacyMax = readStoredNumber('maxTierToday', 1, { min: 1, max: MAX_WEAPON_TIER });
    const currentTier = readStoredNumber('playerTier', 1, { min: 1, max: MAX_WEAPON_TIER });
    return Math.max(1, saved, legacyMax, currentTier);
  });
  const [curiosityInventory, setCuriosityInventory] = useState(() => {
    return sanitizeCountRecord(readStoredObject('curiosityInventory'), CURIOSITIES.map(item => item.id));
  });
  const [curiosityDiscoveries, setCuriosityDiscoveries] = useState(() => {
    return sanitizeCountRecord(readStoredObject('curiosityDiscoveries'), CURIOSITIES.map(item => item.id));
  });
  const [curiositySoldValue, setCuriositySoldValue] = useState(() => readStoredNumber('curiositySoldValue', 0, { min: 0, max: 999_999_999 }));
  const [claimedTitleRewards, setClaimedTitleRewards] = useState(() => {
    const allowedIds = new Set(TITLE_DEFINITIONS.map(title => title.id));
    return [...new Set(readStoredArray('claimedTitleRewards').filter(id => allowedIds.has(id)))];
  });
  const claimedTitleRewardLockRef = useRef(new Set(claimedTitleRewards));

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ id: Date.now() + Math.random(), msg, type }, ...prev].slice(0, 5));
  };

  const playSfx = useCallback((name) => {
    playSoundEffect(name, soundEnabled);
  }, [soundEnabled]);

  const {
    isEnhancing,
    setIsEnhancing,
    enhancementPhase,
    setEnhancementPhase,
    isStriking,
    particles,
    strikeTexts,
    outcome,
    setOutcome,
    outcomeWeaponName,
    setOutcomeWeaponName,
    bonusUpgradeNotice,
    setBonusUpgradeNotice,
    previewWeaponState,
    setPreviewWeaponState,
    flashClass,
    timingWindow,
    resetTimingChallenge,
    startTimingChallenge,
    finishTimingChallenge,
    handleTimingHit,
    triggerFlash,
    triggerStrike,
    scheduleStrike,
    triggerSuccessParticles,
    triggerGreatSuccessParticles,
    triggerFailParticles,
  } = useEnhancementSession({
    playSfx,
    addLog,
  });

  const cycleViewportMode = () => {
    playSfx('page');
    setIsViewportModeManual(true);
    setViewportMode(currentMode => {
      const currentIndex = VIEW_MODES.indexOf(currentMode);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % VIEW_MODES.length : 0;
      return VIEW_MODES[nextIndex];
    });
  };

  const toggleFullscreen = async () => {
    playSfx('page');

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      addLog(`전체화면 전환을 사용할 수 없습니다.`, 'warning');
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('soundEnabled', soundEnabled ? 'true' : 'false');
    } catch (error) {
      reportStorageSaveFailure(error);
    }
  }, [soundEnabled, reportStorageSaveFailure]);

  useEffect(() => {
    try {
      localStorage.setItem('weaponExpeditionStatsV1', JSON.stringify(expeditionStats));
    } catch (error) {
      reportStorageSaveFailure(error);
    }
  }, [expeditionStats, reportStorageSaveFailure]);

  useEffect(() => {
    persistActiveExpedition(expedition, reportStorageSaveFailure);
  }, [expedition, reportStorageSaveFailure]);

  useEffect(() => {
    persistExpeditionEconomy(expeditionEconomy, reportStorageSaveFailure);
  }, [expeditionEconomy, reportStorageSaveFailure]);


  useEffect(() => {
    try {
      localStorage.setItem('unlockedWeapons', JSON.stringify(unlockedWeapons));
    } catch (error) {
      reportStorageSaveFailure(error);
    }
  }, [unlockedWeapons, reportStorageSaveFailure]);

  useEffect(() => {
    try {
      localStorage.setItem('maxTierEver', String(maxTierEver));
      localStorage.setItem('curiosityInventory', JSON.stringify(curiosityInventory));
      localStorage.setItem('curiosityDiscoveries', JSON.stringify(curiosityDiscoveries));
      localStorage.setItem('curiositySoldValue', String(curiositySoldValue));
      localStorage.setItem('claimedTitleRewards', JSON.stringify(claimedTitleRewards));
    } catch (error) {
      reportStorageSaveFailure(error);
    }
  }, [maxTierEver, curiosityInventory, curiosityDiscoveries, curiositySoldValue, claimedTitleRewards, reportStorageSaveFailure]);

  useEffect(() => {
    try {
      localStorage.setItem('maxTierToday', maxTierToday.toString());
    } catch (error) {
      reportStorageSaveFailure(error);
    }
  }, [maxTierToday, reportStorageSaveFailure]);

  useEffect(() => {
    try {
      localStorage.setItem('maxPathToday', maxPathToday ? maxPathToday : 'null');
    } catch (error) {
      reportStorageSaveFailure(error);
    }
  }, [maxPathToday, reportStorageSaveFailure]);

  // Startup hook to check if a new day has arrived
  useEffect(() => {
    const todayStr = getTodayStr();
    const savedLastDate = readStoredString('lastAccessDate', '');

    if (savedLastDate && savedLastDate !== todayStr) {
      // A new day has passed! Load previous max stats to show in the newspaper
      const prevMaxTier = readStoredNumber('maxTierToday', 1, { min: 1, max: MAX_WEAPON_TIER });
      const savedMaxPath = readStoredString('maxPathToday', 'null', ['null', TIMELINE_PATH]);
      const prevMaxPath = savedMaxPath === TIMELINE_PATH ? TIMELINE_PATH : null;

      setMaxTierToday(prevMaxTier);
      setMaxPathToday(prevMaxPath);

      // Open the Newspaper report immediately
      setShowNewspaperModal(true);
      addLog(`🌅 새로운 조선의 아침이 밝아 전날의 결산 일보가 도착했습니다.`, 'warning');
    } else if (!savedLastDate) {
      // First time access
      try {
        localStorage.setItem('lastAccessDate', todayStr);
      } catch (error) {
        reportStorageSaveFailure(error);
      }
    }
  }, [reportStorageSaveFailure]);

  useEffect(() => {
    try {
      localStorage.setItem('playerGold', gold.toString());
    } catch (error) {
      reportStorageSaveFailure(error);
    }
  }, [gold, reportStorageSaveFailure]);

  useEffect(() => {
    try {
      localStorage.setItem('playerTier', tier.toString());
    } catch (error) {
      reportStorageSaveFailure(error);
    }
  }, [tier, reportStorageSaveFailure]);

  useEffect(() => {
    try {
      localStorage.setItem('playerPath', path ? path : 'null');
    } catch (error) {
      reportStorageSaveFailure(error);
    }
  }, [path, reportStorageSaveFailure]);

  useEffect(() => {
    const normalized = normalizeWeaponState(tier, path);
    if (normalized.tier !== tier) {
      setTier(normalized.tier);
    }
    if (normalized.path !== path) {
      setPath(normalized.path);
    }
  }, [tier, path]);

  const unlockWeapon = (targetTier) => {
    const key = targetTier === 1 ? 'common_1' : `${TIMELINE_PATH}_${targetTier}`;
    setUnlockedWeapons(prev => {
      if (prev.includes(key)) return prev;
      return [...prev, key];
    });
  };

  const currentWeaponState = normalizeWeaponState(tier, path);
  const weaponName = getWeaponNameByState(currentWeaponState.tier, currentWeaponState.path);
  const isGameplayLocked = isEnhancing
    || Boolean(outcome)
    || Boolean(expedition)
    || showHistoryArchiveModal
    || showSaveManagerModal;
  const {
    currentQuiz,
    showQuizModal,
    quizPenalty,
    selectedQuizPackId,
    quizLoadState,
    quizLoadError,
    quizQuestionCount,
    quizSessionStats,
    quizStats,
    quizAnswerLocked,
    prepareGoldQuizPack,
    openGoldQuiz,
    handleQuizPackChange,
    closeQuizModal,
    beginQuizAnswer,
    recordQuizCorrect,
    recordQuizWrong,
    beginQuizPenalty,
    scheduleNextQuizQuestion,
  } = useQuizSession({
    isGameplayLocked,
    onStorageFailure: reportStorageSaveFailure,
  });
  const displayWeaponState = previewWeaponState
    ? normalizeWeaponState(previewWeaponState.tier, previewWeaponState.path, currentWeaponState.path || TIMELINE_PATH)
    : currentWeaponState;
  const displayTier = displayWeaponState.tier;
  const displayPath = displayWeaponState.path;
  const displayWeaponName = getWeaponNameByState(displayTier, displayPath);
  const displayedOutcomeWeaponName = outcomeWeaponName || displayWeaponName;
  const outcomeWeaponLabel = outcome === 'success'
    ? `강화 성공! ${displayedOutcomeWeaponName}`
    : outcome === 'bonus'
      ? `대성공! ${displayedOutcomeWeaponName}`
      : outcome === 'fakeout'
        ? `빛이 붙었다... ${displayedOutcomeWeaponName}`
      : outcome === 'false-bonus'
          ? `더는 변하지 않았다... ${displayedOutcomeWeaponName}`
          : outcome === 'fail'
            ? `강화 실패... ${displayedOutcomeWeaponName}`
            : weaponName;

  const remainingUpgradeSteps = Math.max(0, MAX_WEAPON_TIER - tier);
  const curiosityById = Object.fromEntries(CURIOSITIES.map(item => [item.id, item]));
  const titleMetrics = getCuriosityMetrics({
    inventory: curiosityInventory,
    discoveries: curiosityDiscoveries,
    soldValue: curiositySoldValue,
  });
  const {
    uniqueDiscovered,
    ownedTotal: ownedCuriosityTotal,
  } = titleMetrics;
  const activeTitles = TITLE_DEFINITIONS.filter(title => title.check(titleMetrics));
  const maxRestorableTier = Math.min(
    Math.max(1, maxTierEver - 2),
    Math.max(...Object.keys(RESTORE_SHOP_PRICES).map(Number))
  );
  const storedExpeditionLootTotal = Object.values(expeditionEconomy.lootInventory)
    .reduce((sum, count) => sum + count, 0);
  const equippedExpeditionSupply = getExpeditionSupply(expeditionEconomy.equippedSupplyId);

  const getTestEnhancementLockReason = (scenario) => {
    if (remainingUpgradeSteps <= 0) {
      return '최고 단계';
    }

    if ((scenario.requiredSteps || 1) > remainingUpgradeSteps) {
      return `남은 +${remainingUpgradeSteps}`;
    }

    return '';
  };

  const handleAnswer = (selected, e) => {
    if (!beginQuizAnswer()) return;

    const packId = currentQuiz.packId || selectedQuizPackId;

    if (selected === currentQuiz.a) {
      playSfx('coin');
      const pack = getQuizPack(packId);
      const reward = getQuizReward(packId);
      setGold(g => g + reward);
      recordQuizCorrect(packId, reward);
      addLog('[' + pack.shortLabel + '] 정답! +' + reward + '냥 획득', 'success');

      const id = Date.now();
      const rect = e.currentTarget.getBoundingClientRect();
      setFloatingTexts(prev => [...prev, {
        id,
        text: '+' + reward + '냥!',
        x: rect.left + rect.width / 2,
        y: rect.top,
      }]);
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(t => t.id !== id));
      }, 1000);

      scheduleNextQuizQuestion(packId);
      return;
    }

    playSfx('wrong');
    recordQuizWrong(packId);
    addLog('[작업 실수] 정답은 ' + currentQuiz.a + '입니다. 엽전을 얻지 못했습니다.', 'error');
    beginQuizPenalty({
      correctAnswer: currentQuiz.a,
      message: '손이 꼬여 작업이 멈췄습니다. 정답을 확인하고 다시 시작합니다.',
      delayLabel: '다음 문제로 넘어갑니다.',
      onComplete: () => {
        void prepareGoldQuizPack(packId);
      },
    });
  };

  const grantCuriosity = (item) => {
    const isNew = !curiosityDiscoveries[item.id];
    setCuriosityInventory(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
    setCuriosityDiscoveries(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
    setCuriosityDrop({ item, isNew, discoveredAt: Date.now() });
  };

  const rollFailureCuriosity = (attemptTier, timingGrade) => {
    const timingDropBonus = timingGrade === 'perfect' ? 10 : timingGrade === 'good' ? 5 : 0;
    const dropChance = Math.min(65, 15 + attemptTier * 6 + timingDropBonus);
    if (Math.random() * 100 >= dropChance) {
      addLog(`재 속을 뒤졌지만 이번에는 괴작조차 남지 않았습니다.`, 'info');
      return null;
    }

    const rarityWeights = {
      common: Math.max(36, 70 - attemptTier * 4),
      uncommon: 21 + attemptTier * 2,
      rare: 7 + attemptTier * 1.5 + (timingGrade === 'perfect' ? 4 : 0),
      legendary: 1 + Math.max(0, attemptTier - 3) * 1.2 + (timingGrade === 'perfect' ? 1.5 : 0),
    };
    const totalWeight = Object.values(rarityWeights).reduce((sum, weight) => sum + weight, 0);
    let rarityRoll = Math.random() * totalWeight;
    let selectedRarity = 'common';
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      rarityRoll -= weight;
      if (rarityRoll <= 0) {
        selectedRarity = rarity;
        break;
      }
    }

    const pool = CURIOSITIES.filter(item => item.rarity === selectedRarity);
    const item = pool[Math.floor(Math.random() * pool.length)];
    grantCuriosity(item);
    addLog(`🧩 강화 잔해에서 ${CURIOSITY_RARITIES[item.rarity].label} [${item.name}]을 발견했습니다.`, item.rarity === 'legendary' ? 'great-success' : 'warning');
    return item;
  };

  const handleSellCuriosity = (itemId, quantity = 1) => {
    const item = curiosityById[itemId];
    const owned = curiosityInventory[itemId] || 0;
    const safeQuantity = Math.min(owned, Math.max(1, Number(quantity) || 1));
    if (!item || safeQuantity <= 0) return;

    setCuriosityInventory(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - safeQuantity),
    }));
    const saleValue = item.price * safeQuantity;
    setCuriositySoldValue(value => value + saleValue);
    setGold(value => value + saleValue);
    setPendingCuriositySale(null);
    playSfx('coin');
    addLog(`🪙 괴작 [${item.name}] ${safeQuantity}개를 ${saleValue.toLocaleString()}냥에 팔았습니다. 최초 발견 기록은 도감에 남습니다.`, 'success');
  };

  const requestCuriositySale = (itemId, quantity = 1) => {
    const item = curiosityById[itemId];
    if (!item) return;
    const affectedTitles = getCuriositySaleImpact({
      inventory: curiosityInventory,
      discoveries: curiosityDiscoveries,
      soldValue: curiositySoldValue,
    }, itemId, quantity).deactivatedTitles;
    if (affectedTitles.length > 0) {
      setPendingCuriositySale({
        itemId,
        quantity,
        titleNames: affectedTitles.map(title => title.name),
      });
      playSfx('wrong');
      return;
    }
    handleSellCuriosity(itemId, quantity);
  };

  const handleClaimTitleReward = (titleId) => {
    const title = TITLE_DEFINITIONS.find(item => item.id === titleId);
    if (
      !title
      || claimedTitleRewards.includes(titleId)
      || claimedTitleRewardLockRef.current.has(titleId)
      || !title.check(titleMetrics)
    ) return;
    claimedTitleRewardLockRef.current.add(titleId);
    const reward = Math.max(0, Number(title.reward) || 0);
    setClaimedTitleRewards(current => [...new Set([...current, titleId])]);
    if (reward > 0) setGold(current => current + reward);
    playSfx('coin');
    addLog(`🏷️ 칭호 [${title.name}] 달성 보상 +${reward}냥`, 'success');
  };

  const handleExportGameSave = () => {
    let text;
    try {
      if (expedition) persistActiveExpedition(expedition, reportStorageSaveFailure);
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
  };

  const handleImportGameSave = async text => {
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
  };

  const handleUnlockHistoryCard = cardId => {
    const unlocked = unlockExpeditionHistoryCard(expeditionStats, cardId);
    if (unlocked.result !== 'unlocked') return;
    setExpeditionStats(unlocked.stats);
    playSfx('success');
    addLog(`📜 기록 조각으로 [${unlocked.card.weaponName}] 역사 기록을 복원했습니다.`, 'success');
  };

  const openExpedition = () => {
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
    persistActiveExpedition(nextRun, reportStorageSaveFailure);
    persistExpeditionEconomy(supplyUse.economy, reportStorageSaveFailure);
    setExpeditionEconomy(supplyUse.economy);
    setExpedition(nextRun);
    playSfx('page');
    addLog(
      `🗺️ +${tier} [${weaponName}]을 들고 시간 균열 탐사를 시작했습니다.${supplyUse.supply ? ` 준비물 [${supplyUse.supply.name}]을 사용했습니다.` : ''}`,
      'info',
    );
  };

  const handleContinueExpedition = () => {
    if (!expedition || expedition.phase !== 'decision') return;
    const next = continueExpedition(expedition);
    if (next === expedition) return;
    persistActiveExpedition(next, reportStorageSaveFailure);
    setExpedition(next);
    playSfx('page');
  };

  const handleReturnExpedition = () => {
    if (!expedition || expedition.phase !== 'decision') return;
    const settled = settleExpeditionReturn(expedition);
    const settlementId = settled.settlement?.id;
    if (!settlementId || expeditionSettlementLockRef.current.has(settlementId)) return;
    expeditionSettlementLockRef.current.add(settlementId);
    const nextStats = applyExpeditionSettlement(expeditionStats, settled);
    const nextEconomy = applyExpeditionLootSettlement(expeditionEconomy, settled);
    persistActiveExpedition(settled, reportStorageSaveFailure);
    persistExpeditionEconomy(nextEconomy, reportStorageSaveFailure);
    try {
      localStorage.setItem('weaponExpeditionStatsV1', JSON.stringify(nextStats));
    } catch (error) {
      reportStorageSaveFailure(error);
    }
    setExpedition(settled);
    setExpeditionStats(nextStats);
    setExpeditionEconomy(nextEconomy);
    playSfx('success');
    addLog(
      `🏕️ 탐사 안전 귀환! 명성 +${settled.settlement.bankedRenown}, 기록 조각 +${settled.settlement.bankedHistoryFragments}, 전리품 +${Object.values(settled.settlement.bankedLoot).reduce((sum, count) => sum + count, 0)}개`,
      'success',
    );
  };

  const handleCloseExpedition = () => {
    if (!expedition || !['returned', 'defeated'].includes(expedition.phase)) return;
    persistActiveExpedition(null, reportStorageSaveFailure);
    setExpedition(null);
    playSfx('page');
  };

  useEffect(() => {
    if (!expedition || expedition.settled) return undefined;
    const automatedPhases = ['enemy-intro', 'player-attack', 'enemy-telegraph', 'enemy-attack', 'victory', 'npc-intro', 'event-intro'];
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
    const referenceCost = UPGRADE_RATES[expedition.weaponTier]?.cost
      || UPGRADE_RATES[Math.max(1, expedition.weaponTier - 1)]?.cost
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
    persistActiveExpedition(settled, reportStorageSaveFailure);
    persistExpeditionEconomy(nextEconomy, reportStorageSaveFailure);
    try {
      localStorage.setItem('playerGold', String(nextGold));
      localStorage.setItem('weaponExpeditionStatsV1', JSON.stringify(nextStats));
    } catch (error) {
      reportStorageSaveFailure(error);
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
  }, [expedition, expeditionEconomy, expeditionStats, gold, playSfx, reportStorageSaveFailure]);

  useEffect(() => {
    if (!expedition?.settled || !expedition.settlement?.id) return;
    if (expeditionStats.lastSettlementId !== expedition.settlement.id) {
      const recoveredStats = applyExpeditionSettlement(expeditionStats, expedition);
      setExpeditionStats(recoveredStats);
      try {
        localStorage.setItem('weaponExpeditionStatsV1', JSON.stringify(recoveredStats));
      } catch (error) {
        reportStorageSaveFailure(error);
      }
    }
    if (expeditionEconomy.lastLootSettlementId !== expedition.settlement.id) {
      const recoveredEconomy = applyExpeditionLootSettlement(expeditionEconomy, expedition);
      persistExpeditionEconomy(recoveredEconomy, reportStorageSaveFailure);
      setExpeditionEconomy(recoveredEconomy);
    }
    if (
      expedition.settlement.kind === 'defeat'
      && Number.isFinite(expedition.settlement.goldAfter)
      && gold !== expedition.settlement.goldAfter
    ) {
      setGold(expedition.settlement.goldAfter);
    }
  }, [expedition, expeditionEconomy, expeditionStats, gold, reportStorageSaveFailure]);

  const handleBuyExpeditionSupply = supplyId => {
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

    persistExpeditionEconomy(purchased.economy, reportStorageSaveFailure);
    try {
      localStorage.setItem('playerGold', String(purchased.gold));
    } catch (error) {
      reportStorageSaveFailure(error);
    }
    setExpeditionEconomy(purchased.economy);
    setGold(purchased.gold);
    playSfx('success');
    addLog(`🎒 [${purchased.supply.name}]을 만들어 다음 탐사 준비소에 보관했습니다.`, 'success');
  };

  const handleEquipExpeditionSupply = supplyId => {
    if (expedition || isEnhancing || outcome) return;
    const equipped = equipExpeditionSupply(expeditionEconomy, { supplyId });
    if (equipped.result !== 'equipped') {
      if (equipped.result !== 'already-equipped') {
        playSfx('wrong');
        addLog('먼저 전리품과 엽전으로 준비물을 만들어야 합니다.', 'warning');
      }
      return;
    }
    persistExpeditionEconomy(equipped.economy, reportStorageSaveFailure);
    setExpeditionEconomy(equipped.economy);
    playSfx('page');
    addLog(`🎒 [${equipped.supply.name}]을 다음 탐사 준비물로 장착했습니다.`, 'info');
  };

  const handleRestorePurchase = (targetTier) => {
    if (isGameplayLocked) return;
    if (targetTier > maxRestorableTier || targetTier <= tier) return;
    const safeTier = Math.max(1, targetTier);
    const price = RESTORE_SHOP_PRICES[safeTier];
    if (gold < price) {
      addLog(`복원 비용이 부족합니다. +${safeTier} 복원에는 ${price.toLocaleString()}냥이 필요합니다.`, 'warning');
      return;
    }

    const restoredState = normalizeWeaponState(safeTier, safeTier > 1 ? TIMELINE_PATH : null);
    setGold(value => value - price);
    setTier(restoredState.tier);
    setPath(restoredState.path);
    unlockWeapon(restoredState.tier);
    setShowRestoreShopModal(false);
    playSfx('success');
    addLog(`🧰 복원 무기고에서 +${safeTier} [${getWeaponNameByState(restoredState.tier, restoredState.path)}]을 복원했습니다.`, 'success');
  };

  const applySuccessfulUpgradeStep = (targetTier, targetPath) => {
    const nextState = normalizeWeaponState(targetTier, targetPath, path || TIMELINE_PATH);
    setTier(nextState.tier);
    setPath(nextState.path);
    if (nextState.tier > 1) {
      setMaxPathToday(nextState.path);
    }
    setMaxTierToday(mt => Math.max(mt, nextState.tier));
    setMaxTierEver(mt => Math.max(mt, nextState.tier));
    unlockWeapon(nextState.tier);
    return nextState;
  };

  const resetWeaponAfterFailure = (attemptTier, timingGrade) => {
    rollFailureCuriosity(attemptTier, timingGrade);
    setTier(1);
    setPath(null);
    addLog(`💥 강화 실패... 시간층이 무너지며 무기가 +1 [${WEAPON_TIMELINE[1].name}]로 돌아갔습니다.`, 'error');
  };

  const continueGreatSuccessUpgrade = (currentDisplayTier, finalTargetTier, finalPath, bonusStepIndex = 1, totalBonusSteps = 1) => {
    const currentName = getWeaponNameByState(currentDisplayTier, finalPath);
    const nextTier = Math.min(MAX_WEAPON_TIER, currentDisplayTier + 1);
    const nextName = getWeaponNameByState(nextTier, finalPath);
    const isThirdUpgradeSurge = totalBonusSteps >= 2 && bonusStepIndex >= 2;
    const noticeText = isThirdUpgradeSurge
      ? '어어? 설마...한번 더?'
      : `...오잉? ${currentName} 안쪽의 결이 드러난다?`;
    const strikeDelay = getRandomDelay(1150, 450);
    const holdDelay = strikeDelay + getRandomDelay(950, 650);
    const bonusRevealDelay = holdDelay + getRandomDelay(1500, 800);
    const upgradeApplyDelay = bonusRevealDelay + getRandomDelay(2800, 950);
    setIsEnhancing(true);
    setEnhancementPhase('surging');
    setBonusUpgradeNotice(noticeText);
    setOutcome(null);
    triggerGreatSuccessParticles(0.65);
    addLog(isThirdUpgradeSurge ? `어어? 설마...한번 더?` : `...오잉? ${currentName} 안쪽의 결이 드러납니다.`, 'warning');

    scheduleStrike(360, '깡!', isThirdUpgradeSurge ? 18 : 14);
    scheduleStrike(880, '챙!', isThirdUpgradeSurge ? 20 : 16);
    scheduleStrike(strikeDelay, '번쩍!', 24);
    scheduleStrike(Math.min(holdDelay - 260, strikeDelay + 520), '카앙!', isThirdUpgradeSurge ? 24 : 18);

    setTimeout(() => {
      playSfx('tension');
      setBonusUpgradeNotice(isThirdUpgradeSurge ? '남은 잠재력을 더 끌어낸다...' : `${currentName} 숨은 힘이 올라온다...`);
      triggerStrike('...', 12);
    }, holdDelay);

    scheduleStrike(holdDelay + 620, isThirdUpgradeSurge ? '쾅!' : '깡!', isThirdUpgradeSurge ? 26 : 18);
    scheduleStrike(bonusRevealDelay - 360, '카앙!', isThirdUpgradeSurge ? 28 : 22);

    setTimeout(() => {
      playSfx('success');
      const nextUpgradeState = applySuccessfulUpgradeStep(nextTier, finalPath);
      const nextUpgradeName = getWeaponNameByState(nextUpgradeState.tier, nextUpgradeState.path);
      setOutcomeWeaponName(nextUpgradeName);
      setOutcome('bonus');
      triggerGreatSuccessParticles(isThirdUpgradeSurge ? 1.45 : 1.15);
      triggerFlash('success');
      addLog(`🌟 대성공! ${nextUpgradeName}의 숨은 결이 열렸습니다.`, 'great-success');
    }, bonusRevealDelay);

    setTimeout(() => {
      if (nextTier < finalTargetTier) {
        setOutcome(null);
        setBonusUpgradeNotice('');
        setTimeout(() => {
          playSfx('tension');
          setBonusUpgradeNotice(`${nextName} 속의 결을 다시 두드린다...`);
          triggerStrike('...', 10);
        }, getRandomDelay(1200, 550));
        scheduleStrike(getRandomDelay(2050, 500), '챙...', 14);
        scheduleStrike(getRandomDelay(2650, 520), '카앙!', 20);
        setTimeout(() => {
          continueGreatSuccessUpgrade(nextTier, finalTargetTier, finalPath, bonusStepIndex + 1, totalBonusSteps);
        }, getRandomDelay(3150, 900));
        return;
      }

      setIsEnhancing(false);
      setEnhancementPhase('idle');
      setBonusUpgradeNotice('');
      setOutcome(null);
      addLog(`✨ 최종 강화 +${nextTier} 강 도달!`, 'success');
    }, upgradeApplyDelay);
  };

  const continueFalseGreatSuccessTease = (currentDisplayTier, finalPath) => {
    const currentName = getWeaponNameByState(currentDisplayTier, finalPath);
    const strikeDelay = getRandomDelay(1050, 450);
    const holdDelay = strikeDelay + getRandomDelay(1050, 650);
    const falseRevealDelay = holdDelay + getRandomDelay(1450, 850);
    const settleDelay = falseRevealDelay + getRandomDelay(1550, 800);
    setIsEnhancing(true);
    setEnhancementPhase('surging');
    setBonusUpgradeNotice(`...오잉? ${currentName} 안쪽의 결이 드러난다?`);
    setOutcome(null);
    triggerGreatSuccessParticles(0.55);
    addLog(`...오잉? ${currentName} 안쪽의 결이 드러납니다.`, 'warning');

    scheduleStrike(420, '깡!', 12);
    scheduleStrike(940, '챙!', 14);
    scheduleStrike(strikeDelay, '번쩍!', 18);
    scheduleStrike(Math.min(holdDelay - 240, strikeDelay + 520), '카앙!', 16);

    setTimeout(() => {
      playSfx('tension');
      setBonusUpgradeNotice(`${currentName} 숨은 힘이 올라올 듯하다...`);
      triggerStrike('...', 10);
    }, holdDelay);

    scheduleStrike(holdDelay + 620, '깡!', 16);
    scheduleStrike(falseRevealDelay - 360, '챙...', 14);

    setTimeout(() => {
      playSfx('page');
      setOutcomeWeaponName(currentName);
      setOutcome('false-bonus');
      triggerGreatSuccessParticles(0.42);
      addLog(`빛이 잦아들었습니다. 추가 변화 없이 +${currentDisplayTier} 강에서 멈췄습니다.`, 'info');
    }, falseRevealDelay);

    setTimeout(() => {
      setIsEnhancing(false);
      setEnhancementPhase('idle');
      setBonusUpgradeNotice('');
      setOutcome(null);
    }, settleDelay);
  };

  const handleUpgrade = (selectedPath = null) => {
    if (isGameplayLocked) return; // Prevent multiple clicks

    if (tier >= MAX_WEAPON_TIER) {
      addLog(`👑 이미 최고 단계입니다. 강화와 대강화는 더 이상 진행할 수 없습니다.`, 'warning');
      return;
    }

    const currentRateInfo = UPGRADE_RATES[tier];
    if (!currentRateInfo) return;

    if (gold < currentRateInfo.cost) {
      addLog(`엽전이 부족합니다. (필요: ${currentRateInfo.cost}냥)`, 'warning');
      return;
    }

    // Pay cost and start suspense animation
    setGold(g => g - currentRateInfo.cost);
    setIsEnhancing(true);
    setEnhancementPhase('hammering');
    setPreviewWeaponState(null);
    resetTimingChallenge();
    addLog(`대장장이가 망치를 고쳐 쥐고 벼리기를 시작합니다...`, 'info');

    const strikeSequence = [
      { delay: 240, text: '깡!', particles: 12 },
      { delay: 620, text: '챙!', particles: 14 },
      { delay: 1000, text: '탕!', particles: 15 },
      { delay: 1380, text: '카앙!', particles: 18 },
      { delay: 1780, text: '쨍!', particles: 16 },
      { delay: 2180, text: '쾅!', particles: 20 },
      { delay: 2580, text: '깡!', particles: 18 },
      { delay: 2940, text: '쾅!', particles: 24 },
    ];

    strikeSequence.forEach(({ delay, text, particles }) => {
      setTimeout(() => triggerStrike(text, particles), delay);
    });

    const judgingDelay = getRandomDelay(3050, 520);
    const finalStrikeDelay = judgingDelay + 2200;
    const decisionDelay = finalStrikeDelay + getRandomDelay(360, 460);

    setTimeout(() => {
      setEnhancementPhase('judging');
      startTimingChallenge();
      playSfx('tension');
      addLog(`불꽃이 무기 위에서 크게 흔들립니다. 움직이는 표식이 중앙에 올 때 마지막 타격을 입력하세요.`, 'warning');
    }, judgingDelay);

    setTimeout(() => triggerStrike(Math.random() < 0.45 ? '쾅!' : '카앙!', 30), finalStrikeDelay);

    // Decision after a longer dramatic forge sequence
    setTimeout(() => {
      setIsEnhancing(false);
      setEnhancementPhase('idle');
      setBonusUpgradeNotice('');
      const timingGrade = finishTimingChallenge();
      const effectiveRate = Math.min(100, currentRateInfo.rate + TIMING_BONUS[timingGrade]);
      const roll = Math.random() * 100;

      if (roll <= effectiveRate) {
        // Success
        const finalPath = tier <= 1
          ? (isWeaponPath(selectedPath) ? selectedPath : TIMELINE_PATH)
          : normalizeWeaponState(tier, path, selectedPath || TIMELINE_PATH).path;
        const firstTier = Math.min(MAX_WEAPON_TIER, tier + 1);
        const firstUpgradeState = applySuccessfulUpgradeStep(firstTier, finalPath);
        setOutcomeWeaponName(getWeaponNameByState(firstUpgradeState.tier, firstUpgradeState.path));
        playSfx('success');
        setOutcome('success');
        triggerSuccessParticles();
        triggerFlash('success');
        addLog(`✨ 강화 성공! 무기의 결이 단단해졌습니다.`, 'success');

        setTimeout(() => {
          const totalSteps = getGreatSuccessStepCount(tier);
          const finalTargetTier = Math.min(MAX_WEAPON_TIER, tier + totalSteps);
          const shouldFalseAlarm = totalSteps === 1 && firstTier < MAX_WEAPON_TIER && Math.random() * 100 < GREAT_SUCCESS_FALSE_ALARM_RATE;

          if (finalTargetTier > firstTier) {
            continueGreatSuccessUpgrade(firstTier, finalTargetTier, finalPath, 1, finalTargetTier - firstTier);
          } else if (shouldFalseAlarm) {
            continueFalseGreatSuccessTease(firstTier, finalPath);
          } else {
            setOutcome(null);
          }
        }, getRandomDelay(2850, 950));
      } else {
        // Failure
        const fakeoutFailure = Math.random() < 0.55;
        const starterName = getWeaponNameByState(1, null);

        if (fakeoutFailure) {
          const holdDelay = getRandomDelay(950, 650);
          const crackDelay = holdDelay + getRandomDelay(850, 650);
          const shatterDelay = crackDelay + getRandomDelay(850, 700);
          const resetDelay = shatterDelay + getRandomDelay(1850, 850);
          playSfx('near-success');
          setOutcomeWeaponName(weaponName);
          setOutcome('fakeout');
          triggerSuccessParticles();
          triggerFlash('success');
          addLog(`✨ 불꽃이 붙었습니다. 하지만 아직 결이 흔들립니다.`, 'warning');

          setTimeout(() => {
            playSfx('tension');
            triggerStrike('...', 10);
          }, holdDelay);

          setTimeout(() => {
            playSfx('crack');
            triggerStrike('쩌적!', 22);
          }, crackDelay);

          setTimeout(() => {
            playSfx('shatter');
            setOutcomeWeaponName(starterName);
            setOutcome('fail');
            triggerFailParticles();
            triggerFlash('fail');
            addLog(`💥 쨍그랑! 빛이 꺼지며 균열이 번졌습니다.`, 'error');
          }, shatterDelay);

          setTimeout(() => {
            setOutcome(null);
            resetWeaponAfterFailure(tier, timingGrade);
          }, resetDelay);
        } else {
          playSfx('shatter');
          setOutcomeWeaponName(starterName);
          setOutcome('fail');
          triggerFailParticles();
          triggerFlash('fail');
          resetWeaponAfterFailure(tier, timingGrade);

          setTimeout(() => {
            setOutcome(null);
          }, getRandomDelay(1550, 700));
        }
      }
    }, decisionDelay);
  };

  const triggerMidnightReport = () => {
    if (isGameplayLocked) return;
    playSfx('page');
    setShowNewspaperModal(true);
    addLog(`🔔 자정 정산일보가 도착했습니다.`, 'warning');
  };

  const completeMidnightReset = () => {
    setMaxTierToday(tier);
    setMaxPathToday(path);
    setShowNewspaperModal(false);

    // Start a new daily record without deleting the player's weapon or savings.
    const todayStr = getTodayStr();
    try {
      localStorage.setItem('lastAccessDate', todayStr);
      localStorage.setItem('maxTierToday', String(tier));
      localStorage.setItem('maxPathToday', path || 'null');
    } catch (error) {
      reportStorageSaveFailure(error);
    }

    addLog(`🌅 일보를 접었습니다. +${tier} [${weaponName}]과 보유 엽전은 그대로 유지됩니다.`, 'info');
  };

  // [테스트 전용] 실제 강화값 없이 다양한 강화 연출만 체험
  const handleTestEnhancementScenario = (scenarioId) => {
    if (isGameplayLocked) return;

    const scenario = TEST_ENHANCEMENT_SCENARIOS.find(item => item.id === scenarioId);
    if (!scenario) return;

    const lockReason = getTestEnhancementLockReason(scenario);
    if (lockReason) {
      addLog(`[체험 불가] ${scenario.label}: ${lockReason}에서는 이 강화 흐름을 볼 수 없습니다.`, 'warning');
      return;
    }

    const isGreatSuccessPreview = scenarioId === 'great-2' || scenarioId === 'great-3';
    const totalUpgradeSteps = scenarioId === 'great-3' ? 3 : scenarioId === 'great-2' ? 2 : 1;
    const previewPath = path || TIMELINE_PATH;
    const previewBaseTier = Math.max(1, Math.min(tier, MAX_WEAPON_TIER - totalUpgradeSteps));
    const previewBasePath = previewBaseTier > 1 ? previewPath : null;
    const startName = getWeaponNameByState(previewBaseTier, previewPath);
    const firstTier = Math.min(MAX_WEAPON_TIER, previewBaseTier + 1);
    const firstName = getWeaponNameByState(firstTier, previewPath);
    const secondTier = Math.min(MAX_WEAPON_TIER, previewBaseTier + 2);
    const secondName = getWeaponNameByState(secondTier, previewPath);
    const thirdTier = Math.min(MAX_WEAPON_TIER, previewBaseTier + 3);
    const thirdName = getWeaponNameByState(thirdTier, previewPath);
    const strikeSequence = {
      'success-v1': [
        { delay: 240, text: '깡!', particles: 12 },
        { delay: 620, text: '챙!', particles: 14 },
        { delay: 1000, text: '탕!', particles: 15 },
        { delay: 1420, text: '카앙!', particles: 18 },
        { delay: 1920, text: '쨍!', particles: 16 },
        { delay: 2480, text: '쾅!', particles: 20 },
        { delay: 3060, text: '카앙!', particles: 24 },
      ],
      'success-v2': [
        { delay: 300, text: '탕!', particles: 12 },
        { delay: 760, text: '깡!', particles: 15 },
        { delay: 1280, text: '챙!', particles: 16 },
        { delay: 1840, text: '카앙!', particles: 18 },
        { delay: 2440, text: '쾅!', particles: 22 },
        { delay: 3180, text: '쨍!', particles: 18 },
        { delay: 3860, text: '쾅!', particles: 26 },
      ],
      'fail-v1': [
        { delay: 220, text: '깡!', particles: 12 },
        { delay: 660, text: '챙!', particles: 14 },
        { delay: 1080, text: '탕!', particles: 15 },
        { delay: 1600, text: '카앙!', particles: 17 },
        { delay: 2240, text: '쾅!', particles: 20 },
        { delay: 2920, text: '쨍!', particles: 18 },
      ],
      'fail-v2': [
        { delay: 260, text: '깡!', particles: 13 },
        { delay: 720, text: '챙!', particles: 15 },
        { delay: 1240, text: '탕!', particles: 15 },
        { delay: 1780, text: '카앙!', particles: 19 },
        { delay: 2380, text: '쾅!', particles: 21 },
        { delay: 3080, text: '깡!', particles: 18 },
        { delay: 3820, text: '카앙!', particles: 24 },
      ],
      'great-2': [
        { delay: 240, text: '깡!', particles: 12 },
        { delay: 620, text: '챙!', particles: 14 },
        { delay: 1000, text: '탕!', particles: 15 },
        { delay: 1380, text: '카앙!', particles: 18 },
        { delay: 1780, text: '쨍!', particles: 16 },
        { delay: 2180, text: '쾅!', particles: 20 },
        { delay: 2580, text: '깡!', particles: 18 },
        { delay: 2940, text: '쾅!', particles: 24 },
      ],
      'great-3': [
        { delay: 240, text: '깡!', particles: 12 },
        { delay: 640, text: '챙!', particles: 14 },
        { delay: 1060, text: '탕!', particles: 15 },
        { delay: 1480, text: '카앙!', particles: 18 },
        { delay: 1940, text: '쨍!', particles: 16 },
        { delay: 2440, text: '쾅!', particles: 20 },
        { delay: 3000, text: '깡!', particles: 18 },
        { delay: 3520, text: '쾅!', particles: 24 },
      ],
    }[scenarioId];

    const finishPreview = (delay) => {
      setTimeout(() => {
        setIsEnhancing(false);
        setEnhancementPhase('idle');
        setBonusUpgradeNotice('');
        setOutcome(null);
        setOutcomeWeaponName('');
        setPreviewWeaponState(null);
        addLog(`[체험] ${scenario.label} 연출 종료. 실제 강화 단계는 유지됩니다.`, 'info');
      }, delay);
    };

    const revealSuccess = (delay, targetTier, targetName, outcomeType = 'success') => {
      setTimeout(() => {
        setIsEnhancing(false);
        setEnhancementPhase('idle');
        setPreviewWeaponState({ tier: targetTier, path: previewPath });
        setOutcomeWeaponName(targetName);
        setOutcome(outcomeType);
        playSfx('success');
        if (outcomeType === 'bonus') {
          triggerGreatSuccessParticles(targetTier >= thirdTier ? 1.45 : 1.15);
        } else {
          triggerSuccessParticles();
        }
        triggerFlash('success');
        addLog(
          outcomeType === 'bonus'
            ? `🌟 [체험] 대성공! ${targetName}의 숨은 결이 열렸습니다.`
            : `✨ [체험] 강화 성공! ${targetName}의 결이 단단해졌습니다.`,
          outcomeType === 'bonus' ? 'great-success' : 'success'
        );
      }, delay);
    };

    const startGreatSuccessSurge = (delay) => {
      setTimeout(() => {
        setIsEnhancing(true);
        setEnhancementPhase('surging');
        setOutcome(null);
        setOutcomeWeaponName('');
        setBonusUpgradeNotice(`...오잉? ${firstName} 안쪽의 결이 드러난다?`);
        playSfx('tension');
        triggerGreatSuccessParticles(0.62);
        addLog(`...오잉? ${firstName} 안쪽의 결이 드러납니다.`, 'warning');
      }, delay);

      scheduleStrike(delay + 860, '깡!', 14);
      scheduleStrike(delay + 1460, '챙!', 16);
      scheduleStrike(delay + 2240, '번쩍!', 24);
      scheduleStrike(delay + 3160, '카앙!', 22);

      setTimeout(() => {
        playSfx('tension');
        setBonusUpgradeNotice(`${firstName} 숨은 힘을 더 끌어낸다...`);
        triggerStrike('...', 12);
      }, delay + 3880);

      scheduleStrike(delay + 4620, '쾅!', 24);
      scheduleStrike(delay + 5280, '카앙!', 26);
    };

    const startThirdStepSurge = (delay) => {
      setTimeout(() => {
        setIsEnhancing(true);
        setEnhancementPhase('surging');
        setOutcome(null);
        setOutcomeWeaponName('');
        setBonusUpgradeNotice(`${secondName} 속의 결이 조용히 다시 울린다...`);
        playSfx('tension');
        triggerStrike('...', 10);
        addLog(`${secondName} 속의 결이 조용히 다시 울립니다.`, 'warning');
      }, delay);

      scheduleStrike(delay + 1220, '챙...', 14);
      scheduleStrike(delay + 2180, '카앙!', 20);

      setTimeout(() => {
        setBonusUpgradeNotice('어어? 설마...한번 더?');
        triggerGreatSuccessParticles(0.78);
        addLog(`어어? 설마...한번 더?`, 'warning');
      }, delay + 3180);

      scheduleStrike(delay + 4300, '깡!', 18);
      scheduleStrike(delay + 5360, '번쩍!', 28);

      setTimeout(() => {
        playSfx('tension');
        setBonusUpgradeNotice('남은 잠재력을 더 끌어낸다...');
        triggerStrike('...', 14);
      }, delay + 6500);

      scheduleStrike(delay + 7420, '쾅!', 28);
      scheduleStrike(delay + 8120, '카앙!', 30);
    };

    playSfx('page');
    addLog(`[체험] ${scenario.label} 연출을 시작합니다.`, 'warning');
    setIsEnhancing(true);
    setEnhancementPhase('hammering');
    setBonusUpgradeNotice('');
    setOutcomeWeaponName('');
    setOutcome(null);
    setPreviewWeaponState({ tier: previewBaseTier, path: previewBasePath });

    strikeSequence.forEach(({ delay, text, particles }) => {
      scheduleStrike(delay, text, particles);
    });

    const lastStrikeDelay = strikeSequence[strikeSequence.length - 1].delay;
    const judgingDelay = lastStrikeDelay + (scenarioId.endsWith('v2') || isGreatSuccessPreview ? 780 : 620);
    const finalStrikeDelay = judgingDelay + (scenarioId.endsWith('v2') || isGreatSuccessPreview ? 820 : 560);
    const decisionDelay = finalStrikeDelay + (scenarioId.endsWith('v2') || isGreatSuccessPreview ? 1120 : 880);

    setTimeout(() => {
      setEnhancementPhase('judging');
      playSfx('tension');
      addLog(`[체험] 불꽃이 무기 위에서 크게 흔들립니다. 마지막 담금질을 지켜봅니다.`, 'warning');
    }, judgingDelay);

    scheduleStrike(finalStrikeDelay, scenarioId.endsWith('v2') || isGreatSuccessPreview ? '쾅!' : '카앙!', 30);

    if (scenarioId === 'fail-v1') {
      setTimeout(() => {
        setIsEnhancing(false);
        setEnhancementPhase('idle');
        setOutcomeWeaponName(startName);
        setOutcome('fail');
        playSfx('shatter');
        triggerFailParticles();
        triggerFlash('fail');
        addLog(`💥 [체험] 강화 실패... 금이 번지며 무기가 깨졌습니다.`, 'error');
      }, decisionDelay);
      finishPreview(decisionDelay + 2800);
      return;
    }

    if (scenarioId === 'fail-v2') {
      const crackDelay = decisionDelay + 1850;
      const shatterDelay = crackDelay + 1300;

      setTimeout(() => {
        setIsEnhancing(false);
        setEnhancementPhase('idle');
        setOutcomeWeaponName(startName);
        setOutcome('fakeout');
        playSfx('near-success');
        triggerSuccessParticles();
        triggerFlash('success');
        addLog(`✨ [체험] 불꽃이 붙었습니다. 하지만 아직 결이 흔들립니다.`, 'warning');
      }, decisionDelay);

      setTimeout(() => {
        playSfx('tension');
        triggerStrike('...', 10);
      }, decisionDelay + 980);

      setTimeout(() => {
        playSfx('crack');
        triggerStrike('쩌적!', 22);
      }, crackDelay);

      setTimeout(() => {
        setOutcomeWeaponName(startName);
        setOutcome('fail');
        playSfx('shatter');
        triggerFailParticles();
        triggerFlash('fail');
        addLog(`💥 [체험] 쨍그랑! 빛이 꺼지며 균열이 번졌습니다.`, 'error');
      }, shatterDelay);

      finishPreview(shatterDelay + 3000);
      return;
    }

    revealSuccess(decisionDelay, firstTier, firstName);

    if (scenarioId === 'success-v1' || scenarioId === 'success-v2') {
      finishPreview(decisionDelay + (scenarioId === 'success-v2' ? 4200 : 3400));
      return;
    }

    const firstSurgeDelay = decisionDelay + (scenarioId === 'great-3' ? 4700 : 4100);
    const firstBonusRevealDelay = firstSurgeDelay + 6400;
    startGreatSuccessSurge(firstSurgeDelay);
    revealSuccess(firstBonusRevealDelay, secondTier, secondName, 'bonus');

    if (scenarioId === 'great-2') {
      finishPreview(firstBonusRevealDelay + 4200);
      return;
    }

    const thirdSurgeDelay = firstBonusRevealDelay + 4700;
    const thirdBonusRevealDelay = thirdSurgeDelay + 9000;
    startThirdStepSurge(thirdSurgeDelay);
    revealSuccess(thirdBonusRevealDelay, thirdTier, thirdName, 'bonus');
    finishPreview(thirdBonusRevealDelay + 4500);
  };

  // [테스트 전용] 특정 무기를 즉시 세팅
  const handleTestSetWeapon = (testPath, testTier) => {
    if (!SHOW_DEV_TOOLS || isGameplayLocked) return;
    const testState = normalizeWeaponState(testTier, testPath);
    const testName = getWeaponNameByState(testState.tier, testState.path);
    playSfx('page');
    setTier(testState.tier);
    setPath(testState.path);
    unlockWeapon(testState.tier);

    // Update max stats for testing convenience
    setMaxTierToday(mt => Math.max(mt, testState.tier));
    setMaxTierEver(mt => Math.max(mt, testState.tier));
    if (testState.tier > 1) {
      setMaxPathToday(testState.path);
    }

    addLog(`[테스트] +${testState.tier} ${testName} 장착!`, 'warning');
    setShowTestPanel(false);
  };

  return (
    <div className={`app-container ${flashClass}`}>
      {/* RENDER FLOATING TEXTS */}
      {floatingTexts.map(t => (
        <div key={t.id} className="floating-text" style={{ left: t.x, top: t.y }}>
          {t.text}
        </div>
      ))}

      <header className="header glass-panel">
        <div className="header-main">
          <div className="header-title-group">
            <h1>⚒️ 시간역행 대장간</h1>
          </div>
          <div className="header-actions">
            <button
              className="gallery-btn"
              disabled={isGameplayLocked}
              onClick={() => {
                playSfx('page');
                setShowGalleryModal(true);
              }}
            >
              📖 무기 도감
            </button>
            <button
              className="gallery-btn curiosity-header-btn"
              disabled={isGameplayLocked}
              onClick={() => {
                playSfx('page');
                setShowCuriosityModal(true);
              }}
            >
              🧩 괴작 도감 {ownedCuriosityTotal > 0 ? `(${ownedCuriosityTotal})` : ''}
            </button>
            <button
              className="gallery-btn restore-header-btn"
              disabled={isGameplayLocked}
              onClick={() => {
                playSfx('page');
                setShowRestoreShopModal(true);
              }}
            >
              🎒 탐사 준비소 {storedExpeditionLootTotal > 0 ? `(${storedExpeditionLootTotal})` : ''}
            </button>
            <button
              className="gallery-btn history-header-btn"
              disabled={isGameplayLocked}
              onClick={() => {
                playSfx('page');
                setShowHistoryArchiveModal(true);
              }}
            >
              📜 시간 기록관
            </button>
            <button
              className="gallery-btn save-header-btn"
              disabled={isGameplayLocked}
              onClick={() => {
                playSfx('page');
                setShowSaveManagerModal(true);
              }}
            >
              💾 저장·백업
            </button>
            <button
              className={`sound-toggle-btn ${soundEnabled ? 'enabled' : 'muted'}`}
              onClick={() => {
                const nextSoundEnabled = !soundEnabled;
                setSoundEnabled(nextSoundEnabled);
                if (nextSoundEnabled) {
                  playSoundEffect('page', true);
                }
              }}
              title="효과음 켜기/끄기"
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? '🔊 효과음' : '🔇 효과음'}
            </button>
            <button
              className="smith-tool-btn mode-switch-btn"
              onClick={cycleViewportMode}
              title="화면 모드 전환"
            >
              ↔ 모드전환: {viewportMode}
            </button>
            <button
              className="smith-tool-btn fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? '전체화면 종료' : '전체화면'}
            >
              ⛶ {isFullscreen ? '전체화면 종료' : '전체화면'}
            </button>
          </div>
        </div>
        <div className="header-status">
          <div className="gold-display">🪙 {gold.toLocaleString()} 냥</div>
        </div>
      </header>

      {storageSaveFailure && (
        <aside className="save-manager-status is-error storage-save-alert" role="alert" aria-live="assertive">
          <strong>⚠️ {storageSaveFailure.title}</strong>
          <p>
            {storageSaveFailure.message} 현재 진행은 이 탭을 닫으면 사라질 수 있습니다.
            가능하면 저장·백업에서 저장 데이터 파일을 기기에 보관하세요.
          </p>
          <button
            type="button"
            className="save-export-btn"
            disabled={isGameplayLocked}
            onClick={() => setShowSaveManagerModal(true)}
          >
            💾 파일 백업 열기
          </button>
        </aside>
      )}

      <div className="main-content">
        <section className={`smith-section glass-panel`}>
          <div className={`weapon-display ${isEnhancing ? 'is-enhancing' : ''} ${enhancementPhase === 'judging' ? 'judging' : ''} ${enhancementPhase === 'surging' ? 'surging' : ''} ${isStriking ? 'is-striking' : ''} ${outcome ? outcome : ''}`}>
            <div
              className="bg-layer"
              style={{ backgroundImage: `url(${getImageUrl('anvil_bg.png')})` }}
            ></div>
            <div className="furnace-glow"></div>
            <div className="weapon-glow"></div>
            {(enhancementPhase === 'surging' || outcome === 'bonus') && (
              <div className="great-success-aura" aria-hidden="true">
                <span className="aura-ring aura-ring-one"></span>
                <span className="aura-ring aura-ring-two"></span>
                <span className="aura-core"></span>
              </div>
            )}

            <div className="weapon-tier">+{displayTier} 강</div>

            {(timingWindow.active || timingWindow.grade) && (
              <div className={`timing-challenge ${timingWindow.active ? 'is-active' : `is-${timingWindow.grade}`}`}>
                <div className="timing-copy">
                  <strong>{timingWindow.active ? '마지막 타격!' : timingWindow.grade === 'perfect' ? 'PERFECT' : timingWindow.grade === 'good' ? 'GOOD' : '기본 판정'}</strong>
                  <span>{timingWindow.active ? '중앙 금빛 영역에 맞춰 누르세요' : `성공률 보너스 +${TIMING_BONUS[timingWindow.grade] || 0}%p`}</span>
                </div>
                <div className="timing-track" aria-hidden="true">
                  <span className="timing-good-zone" />
                  <span className="timing-perfect-zone" />
                  {timingWindow.active ? (
                    <span className="timing-indicator" />
                  ) : (
                    <span className="timing-result-marker" style={{ left: `${timingWindow.position ?? 0}%` }} />
                  )}
                </div>
                {timingWindow.active && (
                  <button className="timing-hit-button" type="button" onClick={handleTimingHit} autoFocus>
                    터치 · 클릭 · Enter
                  </button>
                )}
              </div>
            )}

            <div className="worktable-container">
              <div className="weapon-wrapper">
                <WeaponImage path={displayPath} tier={displayTier} name={displayWeaponName} />
              </div>
            </div>

            {/* Sparks and Smoke particles */}
            {particles.map(p => (
              <div
                key={p.id}
                className={`${p.type}-particle`}
                style={{
                  left: p.left,
                  top: p.top,
                  '--dx': p.dx,
                  '--dy': p.dy,
                  '--rotate': p.rotate || '0rad'
                }}
              />
            ))}

            {/* Strike Text popups */}
            {strikeTexts.map(st => (
              <div
                key={st.id}
                className="strike-text"
                style={{ left: st.x, top: st.top }}
              >
                {st.text}
              </div>
            ))}

          </div>

          <div className={`weapon-name ${outcome ? `outcome-name ${outcome}` : ''}`}>
            {outcome ? outcomeWeaponLabel : enhancementPhase === 'judging' ? '마지막 담금질...' : enhancementPhase === 'surging' ? (bonusUpgradeNotice || displayWeaponName) : isEnhancing ? '망치질 중...' : displayWeaponName}
          </div>

          <div className="upgrade-controls">
            {tier < 7 ? (
              <>
                <div className="upgrade-info">
                  <span>비용: {UPGRADE_RATES[tier].cost} 냥</span>
                  <span>기본 {UPGRADE_RATES[tier].rate}% · PERFECT {Math.min(100, UPGRADE_RATES[tier].rate + TIMING_BONUS.perfect)}%</span>
                </div>

                <div className="smith-action-row">
                  <button
                    className="btn-primary quiz-toggle-btn primary-action-btn"
                    onClick={openGoldQuiz}
                    disabled={isGameplayLocked}
                  >
                    <span className="coin-image-icon" aria-hidden="true" />
                    <span>퀴즈로 엽전 벌기</span>
                  </button>
                  <button className="btn-success upgrade-main-btn primary-action-btn" onClick={() => handleUpgrade(TIMELINE_PATH)} disabled={isGameplayLocked}>
                    🔨 시간역행 강화
                  </button>
                  <button
                    className="expedition-open-btn primary-action-btn"
                    onClick={openExpedition}
                    disabled={isGameplayLocked}
                  >
                    🗺️ 시간 균열 탐사
                  </button>
                </div>
              </>
            ) : (
              <div className="smith-action-row">
                <button
                  className="btn-primary quiz-toggle-btn primary-action-btn"
                  onClick={openGoldQuiz}
                  disabled={isGameplayLocked}
                >
                  <span className="coin-image-icon" aria-hidden="true" />
                  <span>퀴즈로 엽전 벌기</span>
                </button>
                <div className="max-tier-notice primary-action-btn">
                  <strong>👑 최종 단계 무기입니다!</strong>
                  <span>강화와 대강화 불가</span>
                </div>
                <button
                  className="expedition-open-btn primary-action-btn"
                  onClick={openExpedition}
                  disabled={isGameplayLocked}
                >
                  🗺️ 시간 균열 탐사
                </button>
              </div>
            )}
            <div className="expedition-summary-note" aria-live="polite">
              <span>7개 역사층 자동전투 · 안전 귀환 전까지 전리품은 임시 보관{equippedExpeditionSupply ? ` · 준비물 ${equippedExpeditionSupply.name} 장착` : ''}</span>
              <strong>귀환 {expeditionStats.safeReturns} · 명성 {expeditionStats.renown.toLocaleString()} · 기록 조각 {expeditionStats.historyFragments} · 창고 재료 {storedExpeditionLootTotal}</strong>
            </div>
          </div>
        </section>
      </div>

      {SHOW_DEV_TOOLS && (
      <div className="glass-panel" style={{padding: '1rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap'}}>
        <button style={{background: '#374151'}} onClick={triggerMidnightReport}>
          🌙 시간 가속 (자정 초기화 테스트)
        </button>
        <div className="dev-preview-panel">
          <div className="dev-preview-title">강화 연출 체험</div>
          <div className="dev-preview-grid">
            {TEST_ENHANCEMENT_SCENARIOS.map(scenario => {
              const lockReason = getTestEnhancementLockReason(scenario);
              const isLocked = Boolean(lockReason);

              return (
                <button
                  key={scenario.id}
                  className={`dev-preview-btn ${isLocked ? 'locked' : ''}`}
                  onClick={() => handleTestEnhancementScenario(scenario.id)}
                  disabled={isGameplayLocked || isLocked}
                  title={isLocked ? `${scenario.label} 불가: ${lockReason}` : scenario.label}
                >
                  <span>{scenario.label}</span>
                  {isLocked && <small>{lockReason} 불가</small>}
                </button>
              );
            })}
            <button
              className="dev-preview-btn curiosity-preview-btn"
              type="button"
              disabled={isGameplayLocked || Boolean(curiosityDrop)}
              onClick={() => setCuriosityDrop({ item: CURIOSITIES[4], isNew: true, discoveredAt: Date.now() })}
            >
              <span>괴작획득 연출</span>
              <small>도감 수량 변화 없음</small>
            </button>
          </div>
        </div>
        <button
          style={{background: '#7c3aed', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.9rem', width: '100%', marginTop: '0.4rem'}}
          onClick={() => setShowTestPanel(p => !p)}
        >
          🧪 [테스트 모드] 원하는 무기 즉시 획득
        </button>
        {showTestPanel && (
          <div style={{width: '100%', background: '#1f2937', borderRadius: '0.5rem', padding: '0.8rem', marginTop: '0.4rem'}}>
            <div style={{color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem'}}>⚠️ 테스트 전용 - 무기 즉시 선택</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.4rem'}}>
              <div style={{color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.2rem'}}>◼ 단일 시간역행 트리</div>
              {[1,2,3,4,5,6,7].map(t => (
                <button
                  key={`timeline_${t}`}
                  style={{background: '#374151', padding: '0.4rem', borderRadius: '0.3rem', color: 'white', border: '1px solid #4b5563', cursor: 'pointer', fontSize: '0.8rem'}}
                  onClick={() => handleTestSetWeapon(t > 1 ? TIMELINE_PATH : null, t)}
                >+{t} {WEAPON_TIMELINE[t].name}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      <div className="action-log glass-panel">
        {logs.map((log) => (
          <div key={log.id} className={`log-entry ${log.type}`}>
            &gt; {log.msg}
          </div>
        ))}
        {logs.length === 0 && <div style={{color: '#4b5563'}}>&gt; 시스템 로그 대기 중...</div>}
      </div>

      {/* QUIZ MODAL */}
      {showQuizModal && (
        <div className="modal-overlay" onClick={(e) => {
          if(e.target.className === 'modal-overlay') closeQuizModal();
        }}>
          <div className="modal-content glass-panel quiz-workshop-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-workshop-title">
            <button className="close-btn" onClick={closeQuizModal} disabled={Boolean(quizPenalty)}>✕</button>
            <div className="quiz-workshop-heading">
              <div>
                <span className="collection-kicker">위인점프맵 9개 문제팩 · 총 {QUIZ_TOTAL_QUESTION_COUNT}문항</span>
                <h2 id="quiz-workshop-title">📚 퀴즈 대장간</h2>
              </div>
              <div className="quiz-session-summary" aria-label="현재 퀴즈 수익">
                <span>정답 {quizSessionStats.correct}</span>
                <span>오답 {quizSessionStats.wrong}</span>
                <strong>+{quizSessionStats.earned}냥</strong>
              </div>
            </div>

            <label className="quiz-pack-select-label" htmlFor="quiz-pack-select">
              <span>문제 유형</span>
              <select
                id="quiz-pack-select"
                value={selectedQuizPackId}
                onChange={(event) => handleQuizPackChange(event.target.value)}
                disabled={Boolean(quizPenalty) || quizAnswerLocked || quizLoadState === 'loading'}
              >
                {QUIZ_PACKS.map(pack => (
                  <option key={pack.id} value={pack.id}>{pack.icon} {pack.label} · {pack.questionCount}문항</option>
                ))}
              </select>
            </label>

            <div className="quiz-pack-description">
              <span>{getQuizPack(selectedQuizPackId).icon}</span>
              <div>
                <strong>{getQuizPack(selectedQuizPackId).label}</strong>
                <p>{getQuizPack(selectedQuizPackId).description}</p>
              </div>
              <small>정답 보상 {getQuizPack(selectedQuizPackId).reward[0]}~{getQuizPack(selectedQuizPackId).reward[1]}냥</small>
            </div>

            {quizLoadState === 'loading' && (
              <div className="quiz-loading-panel" role="status" aria-live="polite">
                <span aria-hidden="true">⚒️</span>
                <strong>문제 꾸러미를 펼치는 중...</strong>
              </div>
            )}

            {quizLoadState === 'error' && (
              <div className="quiz-load-error" role="alert">
                <strong>문제를 열지 못했습니다.</strong>
                <span>{quizLoadError}</span>
                <button type="button" onClick={() => void prepareGoldQuizPack(selectedQuizPackId, { resetRecent: true })}>다시 불러오기</button>
              </div>
            )}

            {quizLoadState === 'ready' && currentQuiz && (
              <div className={`quiz-question-card ${currentQuiz.hasQuestionImage ? 'has-question-image' : ''} ${currentQuiz.hasChoiceImages ? 'has-choice-images' : ''}`}>
                <div className="quiz-question-meta">
                  <span>{currentQuiz.prompt}</span>
                  <small>{quizQuestionCount}문항 중 무작위 출제 · 연속 {quizSessionStats.streak}정답</small>
                </div>

                {(currentQuiz.text || (!currentQuiz.image && !currentQuiz.hasChoiceImages)) && (
                  <div className="quiz-question">{currentQuiz.text || currentQuiz.q}</div>
                )}

                {currentQuiz.image && (
                  <div className="quiz-question-image-wrap">
                    <img src={currentQuiz.image} alt={currentQuiz.prompt} />
                  </div>
                )}

                {quizPenalty && (
                  <div className="quiz-penalty-panel" role="status" aria-live="polite">
                    <strong>정답을 확인하세요.</strong>
                    <span>{isQuizImageAsset(quizPenalty.correctAnswer) ? '표시된 정답 그림이 맞습니다.' : `정답은 ${quizPenalty.correctAnswer}입니다.`}</span>
                    {isQuizImageAsset(quizPenalty.correctAnswer) && (
                      <img className="quiz-correct-answer-image" src={resolveQuizAssetUrl(quizPenalty.correctAnswer)} alt="정답 전개도" />
                    )}
                    <small>{quizPenalty.remainingSeconds}초 뒤 {quizPenalty.delayLabel}</small>
                  </div>
                )}

                <div className={`quiz-options ${currentQuiz.hasChoiceImages ? 'image-options' : ''}`}>
                  {currentQuiz.options.map((opt, idx) => {
                    const imageChoice = isQuizImageAsset(opt);
                    return (
                      <button
                        key={`${currentQuiz.id}-${idx}`}
                        className={`quiz-option-btn ${imageChoice ? 'image-choice' : ''}`}
                        onClick={(e) => handleAnswer(opt, e)}
                        disabled={Boolean(quizPenalty) || quizAnswerLocked}
                        aria-label={imageChoice ? `그림 선택지 ${idx + 1}` : opt}
                      >
                        {imageChoice
                          ? <img src={resolveQuizAssetUrl(opt)} alt="" />
                          : <span>{opt}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="quiz-lifetime-summary">
              <span>누적 {quizStats.total}문제</span>
              <span>정답률 {quizStats.total ? Math.round((quizStats.correct / quizStats.total) * 100) : 0}%</span>
              <span>최고 {quizStats.bestStreak}연속 정답</span>
              <strong>누적 +{quizStats.earned.toLocaleString()}냥</strong>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY MODAL */}
      {showGalleryModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') setShowGalleryModal(false);
        }}>
          <div
            className="modal-content glass-panel"
            style={{ maxWidth: '800px', width: '95%' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="weapon-gallery-title"
          >
            <button className="close-btn" type="button" aria-label="무기 도감 닫기" autoFocus onClick={() => setShowGalleryModal(false)}>✕</button>
            <h2 id="weapon-gallery-title">📖 시간역행 무기 도감</h2>

            <div className="gallery-layout">
              {/* Left Pane: Tabs and Grid */}
              <div className="gallery-left-pane">
                <div className="gallery-timeline-note">
                  <strong>현대에서 청동기 시대로</strong>
                  <span>강할수록 오래된 무기라는 설정은 게임 속 상상이며, 실제 무기 성능의 우열이 아닙니다.</span>
                </div>

                <div className="gallery-grid">
                  {/* Tier 1 is Old Club (common_1) */}
                  {(() => {
                    const isActive = selectedGalleryItem?.key === 'common_1';
                    return (
                      <button
                        type="button"
                        className={`gallery-card ${isActive ? 'active' : ''}`}
                        aria-pressed={isActive}
                        aria-label={`+1 ${WEAPON_TIMELINE[1].name} 정보 보기`}
                        onClick={() => setSelectedGalleryItem({
                          key: 'common_1',
                          item: WEAPON_TREE.common[1],
                          path: 'common',
                          tier: 1
                        })}
                      >
                        <span className="gallery-card-tier">+1</span>
                        <WeaponImage path="common" tier={1} name={WEAPON_TIMELINE[1].name} className="gallery-card-img" />
                      </button>
                    );
                  })()}

                  {/* Tiers 2 to 7 */}
                  {[2, 3, 4, 5, 6, 7].map(t => {
                    const key = `${TIMELINE_PATH}_${t}`;
                    const isUnlocked = unlockedWeapons.includes(key);
                    const item = WEAPON_TREE[TIMELINE_PATH][t];
                    const isActive = selectedGalleryItem?.key === key;

                    if (!isUnlocked) {
                      return (
                        <div key={key} className="gallery-card locked" aria-label={`+${t} 잠긴 무기`}>
                          <span className="gallery-card-tier">+{t}</span>
                          <span className="gallery-card-lock-icon">🔒</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        key={key}
                        className={`gallery-card ${isActive ? 'active' : ''}`}
                        aria-pressed={isActive}
                        aria-label={`+${t} ${item.name} 정보 보기`}
                        onClick={() => setSelectedGalleryItem({
                          key,
                          item,
                          path: TIMELINE_PATH,
                          tier: t
                        })}
                      >
                        <span className="gallery-card-tier">+{t}</span>
                        <WeaponImage path={TIMELINE_PATH} tier={t} name={item.name} className="gallery-card-img" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Pane: Detail View */}
              <div className="gallery-right-pane">
                {selectedGalleryItem ? (
                  <>
                    <div className="gallery-detail-img-container">
                      <WeaponImage
                        path={selectedGalleryItem.path}
                        tier={selectedGalleryItem.tier}
                        name={selectedGalleryItem.item.name}
                        className="gallery-detail-img"
                      />
                    </div>
                    <div className="gallery-detail-title">
                      {selectedGalleryItem.item.name}
                    </div>
                    <div className="gallery-detail-tier-badge">
                      +{selectedGalleryItem.tier} 역사층 · {selectedGalleryItem.item.era}
                    </div>
                    <p className="gallery-detail-year">{selectedGalleryItem.item.yearLabel}</p>
                    <p className="gallery-detail-role">{selectedGalleryItem.item.role}</p>
                    <p className="gallery-detail-desc"><strong>역사 정보</strong>{selectedGalleryItem.item.fact}</p>
                    <p className="gallery-detail-desc game-lore"><strong>게임 설정</strong>{selectedGalleryItem.item.gameLore}</p>
                    <span className="history-certainty-badge">{selectedGalleryItem.item.certainty}</span>
                    <a className="history-source-link" href={selectedGalleryItem.item.sourceUrl} target="_blank" rel="noreferrer">
                      참고 자료 보기 · {selectedGalleryItem.item.sourceTitle}
                    </a>
                  </>
                ) : (
                  <div style={{ color: '#9ca3af' }}>무기를 선택해 상세 정보를 확인하세요.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAILED CURIOSITY COLLECTION */}
      {showCuriosityModal && (
        <div className="modal-overlay" onClick={(event) => {
          if (event.target.className === 'modal-overlay') setShowCuriosityModal(false);
        }}>
          <div
            className="modal-content glass-panel curiosity-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="curiosity-gallery-title"
          >
            <button className="close-btn" type="button" aria-label="괴작 도감 닫기" autoFocus onClick={() => setShowCuriosityModal(false)}>✕</button>
            <div className="collection-modal-heading">
              <div>
                <span className="collection-kicker">강화 실패의 뜻밖의 잔해</span>
                <h2 id="curiosity-gallery-title">🧩 괴작 도감</h2>
              </div>
              <div className="collection-summary">
                <span>발견 {uniqueDiscovered}/{CURIOSITIES.length}종</span>
                <span>보유 {ownedCuriosityTotal}개</span>
                <span>판매 누적 {curiositySoldValue.toLocaleString()}냥</span>
              </div>
            </div>

            <section className="title-collection" aria-labelledby="curiosity-title-heading">
              <h3 id="curiosity-title-heading">칭호</h3>
              <div className="title-chip-list">
                {TITLE_DEFINITIONS.map(title => {
                  const isActive = activeTitles.some(activeTitle => activeTitle.id === title.id);
                  const isRewardClaimed = claimedTitleRewards.includes(title.id);
                  return (
                    <div key={title.id} className={`title-chip ${isActive ? 'is-active' : 'is-locked'}`} title={title.description}>
                      <strong>{isActive ? '🏷️' : '🔒'} {title.name}</strong>
                      <span>{title.type === 'possession' ? '보유 조건 · 판매 시 비활성 가능' : '영구 발견 칭호'}</span>
                      <small>{isRewardClaimed ? `보상 수령 완료 · ${title.reward}냥` : `달성 보상 · ${title.reward}냥`}</small>
                      {isActive && !isRewardClaimed && (
                        <button type="button" onClick={() => handleClaimTitleReward(title.id)}>보상 받기</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="curiosity-grid">
              {CURIOSITIES.map(item => {
                const discoveredCount = curiosityDiscoveries[item.id] || 0;
                const ownedCount = curiosityInventory[item.id] || 0;
                const rarity = CURIOSITY_RARITIES[item.rarity];
                const duplicateQuantity = Math.max(0, ownedCount - 1);
                const affectedTitles = ownedCount > 0 ? getCuriositySaleImpact({
                  inventory: curiosityInventory,
                  discoveries: curiosityDiscoveries,
                  soldValue: curiositySoldValue,
                }, item.id, 1).deactivatedTitles : [];
                const pendingSale = pendingCuriositySale?.itemId === item.id ? pendingCuriositySale : null;
                return (
                  <article key={item.id} className={`curiosity-card ${discoveredCount ? 'is-discovered' : 'is-undiscovered'}`}>
                    <div className="curiosity-icon" aria-hidden="true">{discoveredCount ? item.icon : '❔'}</div>
                    <div className="curiosity-card-copy">
                      <span className="curiosity-rarity" style={{ color: rarity.color }}>{discoveredCount ? rarity.label : '미발견 괴작'}</span>
                      <h3>{discoveredCount ? item.name : '아직 알 수 없음'}</h3>
                      {discoveredCount ? (
                        <>
                          <p>{item.description}</p>
                          <small>{item.basis} · 누적 발견 {discoveredCount}회</small>
                        </>
                      ) : (
                        <p>강화 실패 뒤 낮은 확률로 발견할 수 있습니다.</p>
                      )}
                    </div>
                    <div className="curiosity-card-actions">
                      <span>보유 {ownedCount}개</span>
                      <button
                        type="button"
                        disabled={ownedCount <= 0}
                        onClick={() => requestCuriositySale(item.id, 1)}
                      >
                        {affectedTitles.length > 0 ? '⚠ 칭호 확인 후 판매' : `${item.price}냥에 1개 판매`}
                      </button>
                      {duplicateQuantity > 0 && (
                        <button
                          type="button"
                          className="curiosity-duplicate-sale"
                          onClick={() => requestCuriositySale(item.id, duplicateQuantity)}
                        >
                          1개 남기고 {duplicateQuantity}개 판매
                        </button>
                      )}
                      {pendingSale && (
                        <div className="curiosity-sale-warning" role="alert">
                          <strong>판매하면 칭호가 비활성화됩니다.</strong>
                          <span>{pendingSale.titleNames.join(', ')}</span>
                          <div>
                            <button type="button" onClick={() => setPendingCuriositySale(null)}>취소</button>
                            <button
                              type="button"
                              className="is-danger"
                              onClick={() => handleSellCuriosity(item.id, pendingSale.quantity)}
                            >
                              그래도 판매
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EXPEDITION WORKSHOP: SUPPLIES, LOOT WAREHOUSE, RESTORE CHECKPOINTS */}
      {showRestoreShopModal && (
        <ExpeditionWorkshopModal
          economy={expeditionEconomy}
          gold={gold}
          currentTier={tier}
          currentWeaponName={weaponName}
          maxRestorableTier={maxRestorableTier}
          onBuySupply={handleBuyExpeditionSupply}
          onEquipSupply={handleEquipExpeditionSupply}
          onRestorePurchase={handleRestorePurchase}
          onClose={() => setShowRestoreShopModal(false)}
        />
      )}

      {showHistoryArchiveModal && (
        <HistoryArchiveModal
          stats={expeditionStats}
          onUnlock={handleUnlockHistoryCard}
          onClose={() => setShowHistoryArchiveModal(false)}
        />
      )}

      {showSaveManagerModal && (
        <SaveManagerModal
          summary={{
            tier,
            weaponName,
            gold,
            activeExpeditionLabel: expedition
              ? `${expedition.depth}층 · ${expedition.phase === 'decision' ? '선택 대기' : '진행 중'}`
              : '대장간에서 안전하게 저장됨',
          }}
          onExport={handleExportGameSave}
          onImport={handleImportGameSave}
          onClose={() => setShowSaveManagerModal(false)}
        />
      )}

      <ExpeditionModal
        run={expedition}
        stats={expeditionStats}
        speed={expeditionSpeed}
        playerSrc={getImageUrl('expedition_player_rear.png')}
        encounterSrc={expedition ? getImageUrl(expedition.encounter.asset) : ''}
        weaponSrc={expedition ? getImageUrl(getWeaponImageFileName(expedition.weaponTier, TIMELINE_PATH)) : ''}
        combatStyle={expedition ? WEAPON_TIMELINE[expedition.weaponTier].combatStyle : 'saber-slash'}
        battlePose={expedition ? WEAPON_TIMELINE[expedition.weaponTier].battlePose : WEAPON_TIMELINE[1].battlePose}
        onToggleSpeed={() => setExpeditionSpeed(current => current === 1 ? 2 : 1)}
        onReturn={handleReturnExpedition}
        onContinue={handleContinueExpedition}
        onSaveCheckpoint={handleExportGameSave}
        onClose={handleCloseExpedition}
      />

      {/* CURIOSITY DROP REVEAL */}
      {curiosityDrop && (
        <div className="curiosity-drop-overlay" role="dialog" aria-modal="true" aria-labelledby="curiosity-drop-title">
          <div className={`curiosity-drop-card rarity-${curiosityDrop.item.rarity}`}>
            <span className="curiosity-drop-kicker">{curiosityDrop.isNew ? 'NEW · 괴작 도감 등록' : '괴작 중복 발견'}</span>
            <div className="curiosity-drop-icon" aria-hidden="true">{curiosityDrop.item.icon}</div>
            <span style={{ color: CURIOSITY_RARITIES[curiosityDrop.item.rarity].color }}>
              {CURIOSITY_RARITIES[curiosityDrop.item.rarity].label}
            </span>
            <h2 id="curiosity-drop-title">{curiosityDrop.item.name}</h2>
            <p>{curiosityDrop.item.description}</p>
            <button type="button" autoFocus onClick={() => setCuriosityDrop(null)}>도감에 보관</button>
          </div>
        </div>
      )}

      {/* NEWSPAPER MODAL */}
      {showNewspaperModal && !expedition && (() => {
        const news = getMidnightNews(maxTierToday, maxPathToday);
        return (
          <div className="newspaper-overlay">
            <div className="newspaper-modal">
              <div className="newspaper-header">
                <h1 className="newspaper-title">大 匠 鍛 日 報</h1>
                <div className="newspaper-meta">
                  <span>제 874호</span>
                  <span>{news.dateStr}</span>
                  <span>발행인: 대장장이</span>
                </div>
              </div>
              <div className="newspaper-headline">
                "{news.title}"
              </div>
              <p className="newspaper-body">
                {news.body}
              </p>
              <button className="newspaper-btn" onClick={completeMidnightReset}>
                🌅 일보 접고 강화 계속하기
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default App;
