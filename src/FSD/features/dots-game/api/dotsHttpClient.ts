import axios, { type AxiosError, type AxiosInstance } from "axios";

import { LocalStorageKey } from "@/FSD/shared/lib/local-storage/localStorageKey";

export type DotsApiErrorBody = Readonly<{
  code?: string;
  messageLocal?: string;
}>;

let localeProvider: (() => string) | null = null;

/** Registers a hook-safe locale supplier (call from a client component). */
export function setDotsApiLocaleProvider(provider: () => string): void {
  localeProvider = provider;
}

/** Reads the dots session bearer token from storage. */
function readToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(LocalStorageKey.DotsOnlineSessionToken);
  } catch {
    return null;
  }
}

/** Extracts a localized API error message from an axios failure. */
export function extractDotsErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }
  const axiosError = error as AxiosError<DotsApiErrorBody>;
  return axiosError.response?.data?.messageLocal ?? null;
}

/** Creates an axios client with auth, locale, and error dispatch interceptors. */
export function createDotsHttpClient(): AxiosInstance {
  const baseURL = process.env.NEXT_PUBLIC_DOTS_API_BASE ?? "/dots";
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const locale = localeProvider?.() ?? "en";
    config.headers.set("Accept-Language", locale);
    const token = readToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const message = extractDotsErrorMessage(error);
      if (message && typeof document !== "undefined") {
        document.dispatchEvent(new CustomEvent("dots-api-error", { detail: { message } }));
      }
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  );

  return client;
}

export const dotsHttp = createDotsHttpClient();
