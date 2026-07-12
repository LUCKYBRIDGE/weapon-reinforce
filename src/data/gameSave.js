export const GAME_SAVE_FORMAT = 'weapon-reinforce-save';
export const GAME_SAVE_VERSION = 1;
export const MAX_GAME_SAVE_BYTES = 1024 * 1024;

// App.jsx가 현재 읽거나 쓰는 진행/설정 값과 진행 중 탐사 스냅샷만
// 저장 파일에 포함한다. 이 목록에 없는 브라우저 데이터는 내보내거나 복원하지 않는다.
export const GAME_SAVE_STORAGE_KEYS = Object.freeze([
  'playerGold',
  'playerTier',
  'playerPath',
  'unlockedWeapons',
  'maxTierEver',
  'maxTierToday',
  'maxPathToday',
  'lastAccessDate',
  'selectedQuizPackId',
  'weaponQuizStats',
  'weaponExpeditionStatsV1',
  'weaponActiveExpeditionV1',
  'weaponExpeditionEconomyV1',
  'curiosityInventory',
  'curiosityDiscoveries',
  'curiositySoldValue',
  'claimedTitleRewards',
  'soundEnabled',
  'randomEncounterStats',
]);

const GAME_SAVE_STORAGE_KEY_SET = new Set(GAME_SAVE_STORAGE_KEYS);
const ENVELOPE_KEYS = new Set(['format', 'version', 'createdAt', 'payload', 'checksum']);
const textEncoder = new TextEncoder();

export class GameSaveError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GameSaveError';
    this.code = code;
  }
}

const isPlainObject = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const canonicalStringify = value => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  return `{${Object.keys(value)
    .sort()
    .map(key => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`)
    .join(',')}}`;
};

const utf8ByteLength = text => textEncoder.encode(text).byteLength;

const assertStorageReader = storage => {
  if (!storage || typeof storage.getItem !== 'function') {
    throw new GameSaveError('STORAGE_UNAVAILABLE', '저장 공간을 읽을 수 없습니다.');
  }
};

const assertStorageWriter = storage => {
  assertStorageReader(storage);
  if (typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
    throw new GameSaveError('STORAGE_UNAVAILABLE', '저장 공간을 교체할 수 없습니다.');
  }
};

const assertCreatedAt = createdAt => {
  if (typeof createdAt !== 'string') {
    throw new GameSaveError('INVALID_SCHEMA', '저장 시각이 올바르지 않습니다.');
  }
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== createdAt) {
    throw new GameSaveError('INVALID_SCHEMA', '저장 시각은 ISO 형식이어야 합니다.');
  }
};

const checksumSource = envelope => canonicalStringify({
  format: envelope.format,
  version: envelope.version,
  createdAt: envelope.createdAt,
  payload: envelope.payload,
});

export const calculateGameSaveChecksum = envelope => {
  const bytes = textEncoder.encode(checksumSource(envelope));
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32-${hash.toString(16).padStart(8, '0')}`;
};

const validateEnvelope = (candidate, { unknownKeyPolicy = 'reject' } = {}) => {
  if (!isPlainObject(candidate)) {
    throw new GameSaveError('INVALID_SCHEMA', '저장 파일의 최상위 형식이 올바르지 않습니다.');
  }
  if (unknownKeyPolicy !== 'reject' && unknownKeyPolicy !== 'ignore') {
    throw new GameSaveError('INVALID_OPTION', '알 수 없는 키 처리 방식이 올바르지 않습니다.');
  }

  const unknownEnvelopeKeys = Object.keys(candidate).filter(key => !ENVELOPE_KEYS.has(key));
  if (unknownEnvelopeKeys.length > 0) {
    throw new GameSaveError('INVALID_SCHEMA', '저장 파일에 알 수 없는 최상위 항목이 있습니다.');
  }
  if (candidate.format !== GAME_SAVE_FORMAT) {
    throw new GameSaveError('UNSUPPORTED_FORMAT', '무기 강화 저장 파일이 아닙니다.');
  }
  if (candidate.version !== GAME_SAVE_VERSION) {
    throw new GameSaveError('UNSUPPORTED_VERSION', '지원하지 않는 저장 파일 버전입니다.');
  }
  assertCreatedAt(candidate.createdAt);
  if (!isPlainObject(candidate.payload)) {
    throw new GameSaveError('INVALID_SCHEMA', '저장 데이터 묶음이 올바르지 않습니다.');
  }
  if (typeof candidate.checksum !== 'string') {
    throw new GameSaveError('INVALID_SCHEMA', '저장 파일 검증값이 없습니다.');
  }

  const expectedChecksum = calculateGameSaveChecksum(candidate);
  if (candidate.checksum !== expectedChecksum) {
    throw new GameSaveError('CHECKSUM_MISMATCH', '저장 파일이 손상되었거나 변경되었습니다.');
  }

  const unknownKeys = Object.keys(candidate.payload).filter(key => !GAME_SAVE_STORAGE_KEY_SET.has(key));
  if (unknownKeys.length > 0 && unknownKeyPolicy === 'reject') {
    throw new GameSaveError('UNKNOWN_STORAGE_KEY', `허용되지 않은 저장 항목이 있습니다: ${unknownKeys.join(', ')}`);
  }

  const payload = {};
  for (const key of GAME_SAVE_STORAGE_KEYS) {
    if (!Object.hasOwn(candidate.payload, key)) continue;
    if (typeof candidate.payload[key] !== 'string') {
      throw new GameSaveError('INVALID_SCHEMA', `${key} 저장값은 문자열이어야 합니다.`);
    }
    payload[key] = candidate.payload[key];
  }

  const envelope = {
    format: GAME_SAVE_FORMAT,
    version: GAME_SAVE_VERSION,
    createdAt: candidate.createdAt,
    payload,
    checksum: '',
  };
  envelope.checksum = calculateGameSaveChecksum(envelope);
  return { envelope, ignoredKeys: unknownKeys };
};

export const createGameSaveSnapshot = (storage, { createdAt = new Date().toISOString() } = {}) => {
  assertStorageReader(storage);
  assertCreatedAt(createdAt);

  const payload = {};
  for (const key of GAME_SAVE_STORAGE_KEYS) {
    const value = storage.getItem(key);
    if (value !== null) payload[key] = String(value);
  }

  const envelope = {
    format: GAME_SAVE_FORMAT,
    version: GAME_SAVE_VERSION,
    createdAt,
    payload,
    checksum: '',
  };
  envelope.checksum = calculateGameSaveChecksum(envelope);
  return envelope;
};

export const serializeGameSave = (envelope, { pretty = true } = {}) => {
  const { envelope: validated } = validateEnvelope(envelope);
  const text = JSON.stringify(validated, null, pretty ? 2 : 0);
  if (utf8ByteLength(text) > MAX_GAME_SAVE_BYTES) {
    throw new GameSaveError('SAVE_TOO_LARGE', '저장 파일은 1MB를 넘을 수 없습니다.');
  }
  return text;
};

export const exportGameSave = (storage, options = {}) => {
  const envelope = createGameSaveSnapshot(storage, options);
  return serializeGameSave(envelope, options);
};

export const parseGameSave = (text, options = {}) => {
  if (typeof text !== 'string') {
    throw new GameSaveError('INVALID_SCHEMA', '저장 파일은 JSON 문자열이어야 합니다.');
  }
  if (utf8ByteLength(text) > MAX_GAME_SAVE_BYTES) {
    throw new GameSaveError('SAVE_TOO_LARGE', '저장 파일은 1MB를 넘을 수 없습니다.');
  }

  let candidate;
  try {
    candidate = JSON.parse(text);
  } catch {
    throw new GameSaveError('INVALID_JSON', '저장 파일의 JSON 형식이 올바르지 않습니다.');
  }
  return validateEnvelope(candidate, options);
};

export const replaceGameSave = (storage, envelope) => {
  assertStorageWriter(storage);
  const { envelope: validated } = validateEnvelope(envelope);
  const previousValues = new Map(GAME_SAVE_STORAGE_KEYS.map(key => [key, storage.getItem(key)]));

  try {
    for (const key of GAME_SAVE_STORAGE_KEYS) storage.removeItem(key);
    for (const [key, value] of Object.entries(validated.payload)) storage.setItem(key, value);
  } catch {
    try {
      for (const key of GAME_SAVE_STORAGE_KEYS) storage.removeItem(key);
      for (const [key, value] of previousValues) {
        if (value !== null) storage.setItem(key, value);
      }
    } catch {
      throw new GameSaveError('STORAGE_WRITE_FAILED', '저장 교체에 실패했고 기존 저장도 완전히 복구하지 못했습니다.');
    }
    throw new GameSaveError('STORAGE_WRITE_FAILED', '저장 교체에 실패하여 기존 저장을 복구했습니다.');
  }

  return {
    importedKeys: Object.keys(validated.payload),
    removedKeys: GAME_SAVE_STORAGE_KEYS.filter(key => !Object.hasOwn(validated.payload, key)),
  };
};

export const importGameSave = (storage, text, options = {}) => {
  const parsed = parseGameSave(text, options);
  const result = replaceGameSave(storage, parsed.envelope);
  return { ...result, envelope: parsed.envelope, ignoredKeys: parsed.ignoredKeys };
};

// 브라우저 전역 접근은 이 작은 경계에서만 수행한다. 나머지 함수는 메모리
// 어댑터를 포함해 Storage와 같은 인터페이스를 가진 객체로 검증할 수 있다.
export const getBrowserGameStorage = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) throw new Error('unavailable');
    return window.localStorage;
  } catch {
    throw new GameSaveError('STORAGE_UNAVAILABLE', '이 브라우저에서는 로컬 저장을 사용할 수 없습니다.');
  }
};
