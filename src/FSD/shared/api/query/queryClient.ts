import { QueryClient } from "@tanstack/react-query";

const QUERY_STALE_TIME_MS = 30_000;
const QUERY_GC_TIME_MS = 5 * 60_000;
const QUERY_RETRY_COUNT = 1;

let cachedClient: QueryClient | null = null;

/** Lazy singleton `QueryClient` for the browser; created on first access. */
export function getQueryClient(): QueryClient {
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        retry: QUERY_RETRY_COUNT,
        refetchOnWindowFocus: false
      }
    }
  });
  return cachedClient;
}
