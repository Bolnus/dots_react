"use client";

import { useQuery } from "@tanstack/react-query";

import type { DotsRoomDetail } from "./dotsOnlineApiTypes";
import { fetchRoom } from "./dotsApi";
import { DOTS_QUERY_KEYS } from "./queryKeys";

type UseRoomQueryResult = Readonly<{
  data: DotsRoomDetail | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
}>;

/** Snapshot fetch for a single room; the live channel keeps it fresh after mount. */
export function useRoomQuery(roomId: string | null): UseRoomQueryResult {
  const { data, error, isLoading, isError } = useQuery<DotsRoomDetail, Error>({
    queryKey: DOTS_QUERY_KEYS.room(roomId ?? "__none__"),
    queryFn: () => fetchRoom(roomId!),
    enabled: roomId !== null,
    staleTime: Number.POSITIVE_INFINITY
  });
  return { data, error, isLoading, isError };
}
