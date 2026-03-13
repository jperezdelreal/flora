// TLDR: Safe localStorage wrappers that never throw

/** TLDR: Read raw string from localStorage (returns null on error) */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** TLDR: Write raw string to localStorage (returns false on error) */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** TLDR: Remove key from localStorage (returns false on error) */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** TLDR: Parse JSON from localStorage with type assertion */
export function loadJSON<T>(key: string): T | null {
  const raw = safeGetItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`storage: Failed to parse JSON for key "${key}"`);
    return null;
  }
}

/** TLDR: Serialize value to JSON and save to localStorage */
export function saveJSON(key: string, data: unknown): boolean {
  try {
    const json = JSON.stringify(data);
    return safeSetItem(key, json);
  } catch {
    console.warn(`storage: Failed to serialize data for key "${key}"`);
    return false;
  }
}

/** TLDR: Check if localStorage is available in this environment */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__flora_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
