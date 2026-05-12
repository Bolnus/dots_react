"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { DotsRoomDetail, DotsRoomEvent } from "./dotsOnlineApiTypes";
import { subscribeRoom } from "./mockServer";
import { DOTS_QUERY_KEYS } from "./queryKeys";

export type UseRoomLiveResult = Readonly<{
  room: DotsRoomDetail | null;
  isConnected: boolean;
}>;

type RoomEventHandlerArgs = Readonly<{
  expectedRoomId: string;
  setRoom: (room: DotsRoomDetail) => void;
  setIsConnected: (value: boolean) => void;
  syncQueryCache: (room: DotsRoomDetail) => void;
}>;

/** Routes a live event to the snapshot state and the react-query cache (drops stale room ids). */
function onRoomEvent(event: DotsRoomEvent, args: RoomEventHandlerArgs): void {
  if (event.room.id !== args.expectedRoomId) {
    return;
  }
  args.setRoom(event.room);
  args.setIsConnected(true);
  args.syncQueryCache(event.room);
}

/** Subscribes to live updates for `roomId` and exposes the latest snapshot. */
export function useRoomLive(roomId: string | null): UseRoomLiveResult {
  const [room, setRoom] = useState<DotsRoomDetail | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  const syncQueryCache = useCallback(
    (next: DotsRoomDetail): void => {
      queryClient.setQueryData(DOTS_QUERY_KEYS.room(next.id), next);
    },
    [queryClient]
  );

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setIsConnected(false);
      return undefined;
    }
    setIsConnected(false);
    setRoom(null);
    const args: RoomEventHandlerArgs = {
      expectedRoomId: roomId,
      setRoom,
      setIsConnected,
      syncQueryCache
    };
    const unsubscribe = subscribeRoom(roomId, (event) => onRoomEvent(event, args));
    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [roomId, syncQueryCache]);

  return { room, isConnected };
}
