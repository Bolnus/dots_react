import axios, { type AxiosError, type AxiosInstance } from "axios";

import { DOTS_API_ERROR_EVENT } from "./dotsApiConsts";
import type { DotsApiErrorBody, DotsHttpRequestConfig } from "./dotsHttpClientTypes";
import type { DotsApiErrorDetail } from "./dotsOnlineApiTypes";
import { LocalStorageKey } from "@/FSD/shared/lib/local-storage/localStorageKey";
import { readStoredString } from "@/FSD/shared/lib/local-storage/localStorage";

let localeProvider: (() => string) | null = null;

/** Registers a hook-safe locale supplier (call from a client component). */
export function setDotsApiLocaleProvider(provider: () => string): void {
  localeProvider = provider;
}

/** Extracts a localized API error message from an axios failure. */
export function extractDotsErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }
  const axiosError = error as AxiosError<DotsApiErrorBody>;
  return axiosError.response?.data?.messageLocal ?? null;
}

/** Extracts a dots API error code from an axios failure. */
export function extractDotsErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }
  const axiosError = error as AxiosError<DotsApiErrorBody>;
  return axiosError.response?.data?.code ?? null;
}

/** Builds axios config that skips the global error modal when set. */
export function withSilentDotsError(silent: boolean): Readonly<{ dotsSilentError?: boolean }> {
  if (!silent) {
    return {};
  }
  return { dotsSilentError: true };
}

/** Returns true when the request opted out of global error dispatch. */
function isSilentDotsRequest(config: DotsHttpRequestConfig | undefined): boolean {
  return config?.dotsSilentError === true;
}

/** Creates an axios client with auth, locale, and error dispatch interceptors. */
export function createDotsHttpClient(): AxiosInstance {
  const baseURL = process.env.NEXT_PUBLIC_DOTS_API_BASE ?? "/dots";
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const locale = localeProvider?.() ?? "en";
    config.headers.set("Accept-Language", locale);
    const token = readStoredString(LocalStorageKey.DotsOnlineSessionToken);
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const axiosError = axios.isAxiosError(error) ? error : null;
      const message = extractDotsErrorMessage(error);
      const silent = isSilentDotsRequest(axiosError?.config as DotsHttpRequestConfig | undefined);
      if (message && !silent && typeof document !== "undefined") {
        document.dispatchEvent(new CustomEvent<DotsApiErrorDetail>(DOTS_API_ERROR_EVENT, { detail: { message } }));
      }
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  );

  return client;
}

export const dotsHttp = createDotsHttpClient();
