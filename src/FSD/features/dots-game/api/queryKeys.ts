import type { QueryClient } from "@tanstack/react-query";

import type { DotsRoomDetail } from "./dotsOnlineApiTypes";

/** Stable react-query keys for the dots online API. */
export const DOTS_QUERY_KEYS = {
  roomsList: ["dots", "rooms"] as const,
  room: (roomId: string) => ["dots", "rooms", roomId] as const
};

/** Writes the fresh room into the per-room cache and invalidates the rooms list. */
export function syncRoomToCache(queryClient: QueryClient, room: DotsRoomDetail): void {
  queryClient.setQueryData(DOTS_QUERY_KEYS.room(room.id), room);
  void queryClient.invalidateQueries({ queryKey: DOTS_QUERY_KEYS.roomsList });
}

/** Drops the per-room cache entry and invalidates the rooms list (used by leave/remove). */
export function dropRoomFromCache(queryClient: QueryClient, roomId: string): void {
  queryClient.removeQueries({ queryKey: DOTS_QUERY_KEYS.room(roomId) });
  void queryClient.invalidateQueries({ queryKey: DOTS_QUERY_KEYS.roomsList });
}
