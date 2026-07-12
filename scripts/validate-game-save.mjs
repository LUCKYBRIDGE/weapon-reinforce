import {
  GAME_SAVE_FORMAT,
  GAME_SAVE_STORAGE_KEYS,
  GAME_SAVE_VERSION,
  MAX_GAME_SAVE_BYTES,
  calculateGameSaveChecksum,
  createGameSaveSnapshot,
  exportGameSave,
  importGameSave,
  parseGameSave,
} from '../src/data/gameSave.js';
import { createExpeditionRun, sanitizeExpeditionRun } from '../src/data/expedition.js';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const expectError = (callback, code, message) => {
  try {
    callback();
  } catch (error) {
    assert(error?.code === code, `${message} (실제 코드: ${error?.code || '없음'})`);
    return;
  }
  throw new Error(`${message} (오류가 발생하지 않음)`);
};

const createMemoryStorage = initialValues => {
  const values = new Map(Object.entries(initialValues || {}).map(([key, value]) => [key, String(value)]));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    dump: () => Object.fromEntries(values),
  };
};

const createSingleFailureStorage = (initialValues, failOnKey) => {
  const values = new Map(Object.entries(initialValues || {}).map(([key, value]) => [key, String(value)]));
  let failed = false;
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => {
      if (!failed && key === failOnKey) {
        failed = true;
        throw new Error('의도한 저장 쓰기 실패');
      }
      values.set(key, String(value));
    },
    removeItem: key => values.delete(key),
    dump: () => Object.fromEntries(values),
  };
};

const createdAt = '2026-07-11T03:04:05.000Z';
const activeRun = createExpeditionRun({
  runId: 'save-file-active-run',
  weaponTier: 4,
  weaponName: '조선 군영 환도',
  seed: 20260711,
});
const source = createMemoryStorage({
  playerGold: '3210',
  playerTier: '4',
  soundEnabled: 'false',
  weaponActiveExpeditionV1: JSON.stringify(activeRun),
  unrelatedAppToken: '절대 내보내면 안 됨',
});

const snapshot = createGameSaveSnapshot(source, { createdAt });
assert(snapshot.format === GAME_SAVE_FORMAT, '저장 파일 식별자가 올바르지 않습니다.');
assert(snapshot.version === GAME_SAVE_VERSION, '저장 파일 버전이 올바르지 않습니다.');
assert(snapshot.createdAt === createdAt, '저장 시각이 보존되지 않습니다.');
assert(snapshot.payload.playerGold === '3210', '진행 값이 스냅샷에 포함되지 않습니다.');
assert(snapshot.payload.weaponActiveExpeditionV1.includes('save-file-active-run'), '진행 중 탐사가 포함되지 않습니다.');
assert(!Object.hasOwn(snapshot.payload, 'unrelatedAppToken'), '허용 목록 밖의 값이 유출되었습니다.');
assert(GAME_SAVE_STORAGE_KEYS.includes('randomEncounterStats'), 'App.jsx의 구형 탐사 이관 키가 누락되었습니다.');
assert(GAME_SAVE_STORAGE_KEYS.includes('weaponExpeditionEconomyV1'), '탐사 전리품·준비물 경제 저장 키가 누락되었습니다.');

const exported = exportGameSave(source, { createdAt, pretty: false });
const parsed = parseGameSave(exported);
assert(parsed.envelope.checksum === snapshot.checksum, '결정적 검증값이 다시 계산될 때 달라집니다.');
assert(JSON.stringify(parsed.envelope.payload) === JSON.stringify(snapshot.payload), '내보내기/읽기 왕복 결과가 다릅니다.');
const reordered = {
  ...snapshot,
  payload: Object.fromEntries(Object.entries(snapshot.payload).reverse()),
};
assert(calculateGameSaveChecksum(reordered) === snapshot.checksum, '키 순서에 따라 결정적 검증값이 달라집니다.');

const destination = createMemoryStorage({
  playerGold: '9',
  playerTier: '7',
  curiosityInventory: '{"old":9}',
  unrelatedAppToken: '그대로 보존',
});
const importResult = importGameSave(destination, exported);
const restored = destination.dump();
assert(restored.playerGold === '3210' && restored.playerTier === '4', '저장 진행이 복원되지 않았습니다.');
assert(restored.soundEnabled === 'false', '저장 설정이 복원되지 않았습니다.');
const restoredActiveRun = sanitizeExpeditionRun(JSON.parse(restored.weaponActiveExpeditionV1));
assert(restoredActiveRun?.runId === activeRun.runId, '진행 중 탐사가 유효한 상태로 복원되지 않았습니다.');
assert(restoredActiveRun?.encounter.id === activeRun.encounter.id, '저장 파일 왕복 뒤 현재 조우가 바뀌었습니다.');
assert(!Object.hasOwn(restored, 'curiosityInventory'), '파일에 없는 허용 키가 교체 과정에서 제거되지 않았습니다.');
assert(restored.unrelatedAppToken === '그대로 보존', '다른 웹 데이터가 교체 과정에서 손상되었습니다.');
assert(importResult.removedKeys.includes('curiosityInventory'), '교체로 제거한 키가 결과에 기록되지 않았습니다.');

const rollbackDestination = createSingleFailureStorage({
  playerGold: '77',
  playerTier: '7',
  curiosityInventory: '{"kept":2}',
  unrelatedAppToken: '그대로 보존',
}, 'playerTier');
const rollbackBefore = rollbackDestination.dump();
expectError(
  () => importGameSave(rollbackDestination, exported),
  'STORAGE_WRITE_FAILED',
  '저장 교체 중 쓰기 실패를 보고하지 못했습니다.',
);
assert(
  Object.keys(rollbackDestination.dump()).length === Object.keys(rollbackBefore).length
    && Object.entries(rollbackBefore).every(([key, value]) => rollbackDestination.dump()[key] === value),
  '저장 교체 실패 뒤 기존 진행이 정확히 복구되지 않았습니다.',
);

const tampered = JSON.parse(exported);
tampered.payload.playerGold = '999999';
expectError(
  () => parseGameSave(JSON.stringify(tampered)),
  'CHECKSUM_MISMATCH',
  '수정된 저장 파일을 검증값으로 차단하지 못했습니다.',
);

const oversized = `{"padding":"${'가'.repeat(MAX_GAME_SAVE_BYTES)}"}`;
expectError(
  () => parseGameSave(oversized),
  'SAVE_TOO_LARGE',
  '1MB를 넘는 저장 파일을 먼저 차단하지 못했습니다.',
);

const withUnknownKey = JSON.parse(exported);
withUnknownKey.payload.serverPassword = 'write-me';
withUnknownKey.checksum = calculateGameSaveChecksum(withUnknownKey);
const unknownText = JSON.stringify(withUnknownKey);
expectError(
  () => parseGameSave(unknownText),
  'UNKNOWN_STORAGE_KEY',
  '기본 정책이 허용 목록 밖의 키를 거부하지 못했습니다.',
);

const ignored = parseGameSave(unknownText, { unknownKeyPolicy: 'ignore' });
assert(ignored.ignoredKeys.length === 1 && ignored.ignoredKeys[0] === 'serverPassword', '무시한 키가 보고되지 않습니다.');
assert(!Object.hasOwn(ignored.envelope.payload, 'serverPassword'), '무시 정책에서 알 수 없는 키가 남았습니다.');

const ignoreDestination = createMemoryStorage({ playerGold: '1', serverPassword: '기존 외부 값' });
const ignoredResult = importGameSave(ignoreDestination, unknownText, { unknownKeyPolicy: 'ignore' });
assert(ignoreDestination.dump().serverPassword === '기존 외부 값', '무시 정책이 허용 목록 밖의 기존 값을 덮어썼습니다.');
assert(ignoredResult.ignoredKeys.includes('serverPassword'), '가져오기 결과에 무시한 키가 없습니다.');

console.log(`저장 파일 검증 통과 · 허용 키 ${GAME_SAVE_STORAGE_KEYS.length}개 · 최대 ${MAX_GAME_SAVE_BYTES / 1024 / 1024}MB · 왕복/변조/교체/쓰기 실패 롤백/알 수 없는 키 정책`);
