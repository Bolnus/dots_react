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

/** Reads the room snapshot for `roomId`; disabled when `roomId` is null. */
function fetchRoomById(roomId: string | null): Promise<DotsRoomDetail> {
  if (!roomId) {
    throw new Error("roomId is required");
  }
  return fetchRoom(roomId);
}

/** Snapshot fetch for a single room; the live channel keeps it fresh after mount. */
export function useRoomQuery(roomId: string | null): UseRoomQueryResult {
  const { data, error, isLoading, isError } = useQuery<DotsRoomDetail, Error>({
    queryKey: roomId ? DOTS_QUERY_KEYS.room(roomId) : DOTS_QUERY_KEYS.room("__none__"),
    queryFn: () => fetchRoomById(roomId),
    enabled: roomId !== null
  });
  return { data, error, isLoading, isError };
}
