import type { LocalStorageKey } from "./localStorageKey";

/** Reads a string from localStorage, or null when unavailable. */
export function readStoredString(key: LocalStorageKey): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Writes a string to localStorage, ignoring quota errors. */
export function writeStoredString(key: LocalStorageKey, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/** Removes a localStorage entry, ignoring quota errors. */
export function removeStoredString(key: LocalStorageKey): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
