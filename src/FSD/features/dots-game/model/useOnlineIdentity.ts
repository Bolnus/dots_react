"use client";

import { useCallback, useEffect, useState } from "react";

import { LocalStorageKey } from "@/FSD/shared/lib/local-storage/localStorageKey";

export type DotsOnlineIdentity = Readonly<{
  userId: string;
  displayName: string | null;
}>;

export type UseOnlineIdentityResult = Readonly<{
  identity: DotsOnlineIdentity | null;
  setDisplayName: (name: string) => void;
}>;

/** Reads a string from `localStorage`, returning `null` for missing values or unavailable storage. */
function readStored(key: LocalStorageKey): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Writes a string to `localStorage`, silently ignoring quota / private-mode errors. */
function writeStored(key: LocalStorageKey, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Quota / private mode: ignore */
  }
}

/** Generates a stable, unique synthetic user id for this browser session. */
function generateUserId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `u-${crypto.randomUUID()}`;
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    return `u-${hex}`;
  }
  return `u-${Date.now().toString(36)}`;
}

/** Returns the existing client user id from storage, generating and persisting one when missing. */
function ensureUserId(): string {
  const existing = readStored(LocalStorageKey.DotsOnlineUserId);
  if (existing && existing.trim()) {
    return existing;
  }
  const next = generateUserId();
  writeStored(LocalStorageKey.DotsOnlineUserId, next);
  return next;
}

/** Hook: returns the persistent online identity for this browser (user id + optional display name). */
export function useOnlineIdentity(): UseOnlineIdentityResult {
  const [identity, setIdentity] = useState<DotsOnlineIdentity | null>(null);

  useEffect(() => {
    const userId = ensureUserId();
    const storedName = readStored(LocalStorageKey.DotsOnlinePlayerName);
    setIdentity({ userId, displayName: storedName && storedName.trim() ? storedName : null });
  }, []);

  const setDisplayName = useCallback((name: string): void => {
    const trimmed = name.trim();
    writeStored(LocalStorageKey.DotsOnlinePlayerName, trimmed);
    setIdentity((prev) => {
      if (!prev) {
        return prev;
      }
      return { ...prev, displayName: trimmed || null };
    });
  }, []);

  return { identity, setDisplayName };
}
