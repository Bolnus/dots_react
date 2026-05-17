"use client";

import { useCallback, useEffect, useState } from "react";

import { registerSession } from "../api/dotsApi";
import { LocalStorageKey } from "@/FSD/shared/lib/local-storage/localStorageKey";

export type DotsOnlineIdentity = Readonly<{
  userId: string;
  displayName: string | null;
}>;

export type UseOnlineIdentityResult = Readonly<{
  identity: DotsOnlineIdentity | null;
  setDisplayName: (name: string) => Promise<void>;
  isRegistering: boolean;
}>;

/** Reads a string from localStorage, or null when unavailable. */
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

/** Writes a string to localStorage, ignoring quota errors. */
function writeStored(key: LocalStorageKey, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/** Hook: server-backed online identity (token + user id + display name). */
export function useOnlineIdentity(): UseOnlineIdentityResult {
  const [identity, setIdentity] = useState<DotsOnlineIdentity | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const userId = readStored(LocalStorageKey.DotsOnlineUserId);
    const token = readStored(LocalStorageKey.DotsOnlineSessionToken);
    const storedName = readStored(LocalStorageKey.DotsOnlinePlayerName);
    if (userId && token && storedName?.trim()) {
      setIdentity({ userId, displayName: storedName.trim() });
    } else if (storedName?.trim()) {
      setIdentity({ userId: userId ?? "", displayName: storedName.trim() });
    }
  }, []);

  const setDisplayName = useCallback(async (name: string): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setIsRegistering(true);
    try {
      const result = await registerSession(trimmed);
      writeStored(LocalStorageKey.DotsOnlineSessionToken, result.token);
      writeStored(LocalStorageKey.DotsOnlineUserId, result.userId);
      writeStored(LocalStorageKey.DotsOnlinePlayerName, result.displayName);
      setIdentity({ userId: result.userId, displayName: result.displayName });
    } finally {
      setIsRegistering(false);
    }
  }, []);

  return { identity, setDisplayName, isRegistering };
}
