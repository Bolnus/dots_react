"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSession } from "./dotsApi";
import type { HeartbeatResult } from "./dotsOnlineApiTypes";
import { DOTS_QUERY_KEYS } from "./queryKeys";

/** Polls the session heartbeat for active-game reconnect info. */
export function useSessionQuery(enabled: boolean): ReturnType<typeof useQuery<HeartbeatResult>> {
  return useQuery({
    queryKey: DOTS_QUERY_KEYS.session,
    queryFn: () => fetchSession(),
    enabled,
    staleTime: 10_000
  });
}
