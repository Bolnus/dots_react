"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

import type { DotsRoomDetail, DotsRoomEvent } from "./dotsOnlineApiTypes";
import { fetchRoom } from "./dotsApi";
import { subscribeDotsRoom } from "./dotsRealtime";
import { DOTS_QUERY_KEYS } from "./queryKeys";

export type UseRoomLiveResult = Readonly<{
  room: DotsRoomDetail | null;
  isConnected: boolean;
  /** Applies an authoritative room snapshot (e.g. after a rejected commit). */
  applyRoomSnapshot: (snapshot: DotsRoomDetail) => void;
}>;

type RoomEventHandlerArgs = Readonly<{
  expectedRoomId: string;
  setRoom: (room: DotsRoomDetail) => void;
  setIsConnected: (value: boolean) => void;
  queryClient: QueryClient;
}>;

/** Applies a realtime room event to local state and the query cache. */
function onRoomEvent(event: DotsRoomEvent, args: RoomEventHandlerArgs): void {
  if (event.room.id !== args.expectedRoomId) {
    return;
  }
  args.setRoom(event.room);
  args.setIsConnected(true);
  args.queryClient.setQueryData(DOTS_QUERY_KEYS.room(event.room.id), event.room);
}

/** Subscribes to live updates for `roomId` and exposes the latest snapshot. */
export function useRoomLive(roomId: string | null): UseRoomLiveResult {
  const [room, setRoom] = useState<DotsRoomDetail | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  const applyRoomSnapshot = useCallback(
    (snapshot: DotsRoomDetail): void => {
      if (!roomId || snapshot.id !== roomId) {
        return;
      }
      setRoom(snapshot);
      queryClient.setQueryData(DOTS_QUERY_KEYS.room(snapshot.id), snapshot);
    },
    [roomId, queryClient]
  );

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setIsConnected(false);
      return undefined;
    }

    const cached = queryClient.getQueryData<DotsRoomDetail>(DOTS_QUERY_KEYS.room(roomId));
    setRoom(cached ?? null);
    setIsConnected(false);

    let cancelled = false;
    if (!cached) {
      void queryClient
        .fetchQuery({
          queryKey: DOTS_QUERY_KEYS.room(roomId),
          queryFn: () => fetchRoom(roomId)
        })
        .then((snapshot) => {
          if (!cancelled) {
            setRoom(snapshot);
          }
        })
        .catch(() => {
          /* HTTP errors surface via the global API error modal */
        });
    }

    const args: RoomEventHandlerArgs = {
      expectedRoomId: roomId,
      setRoom,
      setIsConnected,
      queryClient
    };
    const unsubscribe = subscribeDotsRoom(roomId, (event) => onRoomEvent(event, args));

    return () => {
      cancelled = true;
      unsubscribe();
      setIsConnected(false);
    };
  }, [roomId, queryClient]);

  return { room, isConnected, applyRoomSnapshot };
}
