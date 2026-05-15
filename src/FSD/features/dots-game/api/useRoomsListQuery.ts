"use client";

import { useQuery } from "@tanstack/react-query";

import type { DotsRoomSummary } from "./dotsOnlineApiTypes";
import { fetchRooms } from "./mockServer";
import { DOTS_QUERY_KEYS } from "./queryKeys";

type UseRoomsListQueryResult = Readonly<{
  data: DotsRoomSummary[] | undefined;
  error: Error | null;
  isLoading: boolean;
}>;

/** Returns the live rooms list query (auto-refreshes via mutation invalidation). */
export function useRoomsListQuery(): UseRoomsListQueryResult {
  const { data, error, isLoading } = useQuery<DotsRoomSummary[], Error>({
    queryKey: DOTS_QUERY_KEYS.roomsList,
    queryFn: fetchRooms,
    refetchInterval: 10_000
  });
  return { data, error, isLoading };
}
