const hasLocalStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export const readStoredNumber = (key, fallback = 0, options = {}) => {
  const min = Number.isFinite(options.min) ? options.min : Number.NEGATIVE_INFINITY;
  const max = Number.isFinite(options.max) ? options.max : Number.POSITIVE_INFINITY;
  try {
    if (!hasLocalStorage()) return fallback;
    const rawValue = window.localStorage.getItem(key);
    if (rawValue == null || rawValue.trim() === '') return fallback;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return fallback;
    const normalized = options.integer === false ? value : Math.trunc(value);
    return Math.min(max, Math.max(min, normalized));
  } catch {
    return fallback;
  }
};

export const readStoredObject = (key, fallback = {}) => {
  try {
    if (!hasLocalStorage()) return { ...fallback };
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...fallback };
    return value;
  } catch {
    return { ...fallback };
  }
};

export const readStoredArray = (key, fallback = []) => {
  try {
    if (!hasLocalStorage()) return [...fallback];
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    return Array.isArray(value) ? value : [...fallback];
  } catch {
    return [...fallback];
  }
};

export const readStoredString = (key, fallback = '', allowedValues = null) => {
  try {
    if (!hasLocalStorage()) return fallback;
    const value = window.localStorage.getItem(key);
    if (value == null) return fallback;
    if (Array.isArray(allowedValues) && !allowedValues.includes(value)) return fallback;
    return value;
  } catch {
    return fallback;
  }
};

export const sanitizeCountRecord = (value, allowedIds = null) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const allowed = Array.isArray(allowedIds) ? new Set(allowedIds) : null;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !allowed || allowed.has(key))
      .map(([key, count]) => [key, Math.max(0, Math.trunc(Number(count) || 0))])
      .filter(([, count]) => count > 0),
  );
};

export const sanitizeNumericStats = (value, defaults) => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => {
      const candidate = Number(source[key]);
      return [key, Number.isFinite(candidate) ? Math.max(0, Math.trunc(candidate)) : fallback];
    }),
  );
};
