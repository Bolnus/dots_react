"use client";

import { useCallback, useEffect, useState } from "react";

import { DOTS_API_ERROR_EVENT } from "./dotsApiConsts";
import { resolveDotsErrorMessage } from "./dotsHttpClient";
import type { DotsApiErrorDetail } from "./dotsOnlineApiTypes";

/** Updates error state from a global dots API error document event. */
function onDotsApiErrorEvent(event: Event, setErrorMessage: (message: string) => void): void {
  const { detail } = event as CustomEvent<DotsApiErrorDetail>;
  if (detail?.message) {
    setErrorMessage(detail.message);
  }
}

/** Listens for axios/API failures surfaced via a document event. */
export function useDotsApiErrors(): Readonly<{
  errorMessage: string | null;
  clearError: () => void;
  reportError: (error: unknown) => void;
}> {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const onEvent = (event: Event): void => onDotsApiErrorEvent(event, setErrorMessage);
    document.addEventListener(DOTS_API_ERROR_EVENT, onEvent);
    return () => {
      document.removeEventListener(DOTS_API_ERROR_EVENT, onEvent);
    };
  }, []);

  const reportError = useCallback((error: unknown): void => {
    const message = resolveDotsErrorMessage(error);
    if (message) {
      setErrorMessage(message);
    }
  }, []);

  const clearError = useCallback((): void => {
    setErrorMessage(null);
  }, []);

  return { errorMessage, clearError, reportError };
}

/** Dispatches a global dots API error event for the InfoModal. */
export function dispatchDotsApiError(message: string): void {
  if (typeof document === "undefined") {
    return;
  }
  document.dispatchEvent(new CustomEvent<DotsApiErrorDetail>(DOTS_API_ERROR_EVENT, { detail: { message } }));
}
