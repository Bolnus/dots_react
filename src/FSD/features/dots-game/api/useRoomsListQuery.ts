"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";

import type { DotsRoomSummary } from "./dotsOnlineApiTypes";
import { fetchRooms } from "./mockServer";
import { DOTS_QUERY_KEYS } from "./queryKeys";

/** Returns the live rooms list query (auto-refreshes via mutation invalidation). */
export function useRoomsListQuery(): UseQueryResult<DotsRoomSummary[]> {
  return useQuery({
    queryKey: DOTS_QUERY_KEYS.roomsList,
    queryFn: fetchRooms,
    refetchInterval: 10_000
  });
}
