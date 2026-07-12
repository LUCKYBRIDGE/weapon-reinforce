const values = new Map();
globalThis.window = {
  localStorage: {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
  },
};

const {
  readStoredArray,
  readStoredNumber,
  readStoredObject,
  readStoredString,
  sanitizeCountRecord,
  sanitizeNumericStats,
} = await import('../src/data/safeStorage.js');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

values.set('gold', 'oops');
assert(readStoredNumber('gold', 12, { min: 0, max: 100 }) === 12, '손상된 숫자가 기본값으로 복구되지 않습니다.');
values.set('gold', '-300');
assert(readStoredNumber('gold', 0, { min: 0, max: 100 }) === 0, '음수 엽전이 0으로 제한되지 않습니다.');
values.set('tier', '999');
assert(readStoredNumber('tier', 1, { min: 1, max: 7 }) === 7, '무기 단계 상한이 적용되지 않습니다.');

values.set('object', 'null');
assert(Object.keys(readStoredObject('object')).length === 0, 'null 저장 객체가 빈 객체로 복구되지 않습니다.');
values.set('object', '[]');
assert(Object.keys(readStoredObject('object')).length === 0, '배열 저장 객체가 빈 객체로 복구되지 않습니다.');
values.set('array', '{}');
assert(readStoredArray('array', ['safe'])[0] === 'safe', '손상된 배열이 기본값으로 복구되지 않습니다.');

values.set('path', 'legacy-path');
assert(readStoredString('path', 'null', ['null', 'timeline']) === 'null', '허용되지 않은 경로가 제거되지 않습니다.');

const counts = sanitizeCountRecord({ valid: 3.8, negative: -2, unknown: 9 }, ['valid', 'negative']);
assert(counts.valid === 3 && !Object.hasOwn(counts, 'negative') && !Object.hasOwn(counts, 'unknown'), '괴작 수량 정리가 잘못되었습니다.');

const stats = sanitizeNumericStats({ wins: '4', losses: -3, renown: 'bad' }, { wins: 0, losses: 0, renown: 0 });
assert(stats.wins === 4 && stats.losses === 0 && stats.renown === 0, '통계 저장값 정리가 잘못되었습니다.');

console.log('손상 숫자·객체·배열·경로·수량·통계 저장값 복구 검증 통과');
