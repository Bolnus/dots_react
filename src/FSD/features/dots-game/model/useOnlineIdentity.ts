"use client";

import { useCallback, useEffect, useState } from "react";

import { registerSession, validateSession } from "../api/dotsApi";
import { extractDotsErrorCode, extractDotsErrorMessage } from "../api/dotsHttpClient";
import type { DotsOnlineIdentity, IdentityPhase, UseOnlineIdentityResult } from "./onlineIdentityTypes";
import { LocalStorageKey } from "@/FSD/shared/lib/local-storage/localStorageKey";
import { readStoredString, removeStoredString, writeStoredString } from "@/FSD/shared/lib/local-storage/localStorage";

/** Persists a successful registration result to localStorage and identity state. */
function applyRegistrationResult(
  result: Readonly<{ userId: string; displayName: string; token: string }>,
  setIdentity: (identity: DotsOnlineIdentity | null) => void,
  setPhase: (phase: IdentityPhase) => void
): void {
  writeStoredString(LocalStorageKey.DotsOnlineSessionToken, result.token);
  writeStoredString(LocalStorageKey.DotsOnlineUserId, result.userId);
  writeStoredString(LocalStorageKey.DotsOnlinePlayerName, result.displayName);
  setIdentity({ userId: result.userId, displayName: result.displayName });
  setPhase("authenticated");
}

/** Attempts to reclaim the saved display name and returns whether authentication succeeded. */
async function tryRegisterStoredName(
  storedName: string,
  setIdentity: (identity: DotsOnlineIdentity | null) => void,
  setPhase: (phase: IdentityPhase) => void
): Promise<boolean> {
  try {
    const result = await registerSession(storedName, { silentError: true });
    applyRegistrationResult(result, setIdentity, setPhase);
    return true;
  } catch (error: unknown) {
    if (extractDotsErrorCode(error) === "dotsActiveRoomBlocked") {
      removeStoredString(LocalStorageKey.DotsOnlineSessionToken);
      removeStoredString(LocalStorageKey.DotsOnlineUserId);
      removeStoredString(LocalStorageKey.DotsOnlinePlayerName);
      setIdentity(null);
      setPhase("needs_name");
      return false;
    }
    throw error;
  }
}

/** Resolves online identity from localStorage and server session endpoints. */
async function resolveIdentity(
  setIdentity: (identity: DotsOnlineIdentity | null) => void,
  setPhase: (phase: IdentityPhase) => void,
  setStoredDisplayName: (name: string | null) => void
): Promise<void> {
  const userId = readStoredString(LocalStorageKey.DotsOnlineUserId);
  const token = readStoredString(LocalStorageKey.DotsOnlineSessionToken);
  const storedName = readStoredString(LocalStorageKey.DotsOnlinePlayerName)?.trim() ?? null;

  if (!storedName) {
    setStoredDisplayName(null);
    setIdentity(null);
    setPhase("needs_name");
    return;
  }

  setStoredDisplayName(storedName);
  setPhase("resolving");

  if (token) {
    const isValid = await validateSession();
    if (isValid && userId) {
      setIdentity({ userId, displayName: storedName });
      setPhase("authenticated");
      return;
    }
  }

  try {
    const registered = await tryRegisterStoredName(storedName, setIdentity, setPhase);
    if (!registered) {
      setStoredDisplayName(null);
    }
  } catch {
    setIdentity(null);
    setPhase("needs_name");
  }
}

/** Hook: server-backed online identity (token + user id + display name). */
export function useOnlineIdentity(): UseOnlineIdentityResult {
  const [identity, setIdentity] = useState<DotsOnlineIdentity | null>(null);
  const [phase, setPhase] = useState<IdentityPhase>("resolving");
  const [storedDisplayName, setStoredDisplayName] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    void resolveIdentity(setIdentity, setPhase, setStoredDisplayName);
  }, []);

  const setDisplayName = useCallback(async (name: string): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setIsRegistering(true);
    try {
      const result = await registerSession(trimmed);
      applyRegistrationResult(result, setIdentity, setPhase);
      setStoredDisplayName(result.displayName);
    } catch (error: unknown) {
      const message = extractDotsErrorMessage(error);
      if (message) {
        throw new Error(message);
      }
      throw error;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  return { identity, phase, storedDisplayName, setDisplayName, isRegistering };
}
