"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";

import type { DotsRoomDetail } from "./dotsOnlineApiTypes";
import { fetchRoom } from "./mockServer";
import { DOTS_QUERY_KEYS } from "./queryKeys";

/** Snapshot fetch for a single room; the live channel keeps it fresh after mount. */
export function useRoomQuery(roomId: string | null): UseQueryResult<DotsRoomDetail> {
  return useQuery({
    queryKey: roomId ? DOTS_QUERY_KEYS.room(roomId) : DOTS_QUERY_KEYS.room("__none__"),
    queryFn: () => {
      if (!roomId) {
        throw new Error("roomId is required");
      }
      return fetchRoom(roomId);
    },
    enabled: roomId !== null
  });
}
