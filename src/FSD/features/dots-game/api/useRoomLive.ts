"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

import type { DotsRoomDetail, DotsRoomEvent, UseRoomLiveResult } from "./dotsOnlineApiTypes";
import { fetchRoom } from "./dotsApi";
import { forceReconnectDotsRealtime, onDotsRealtimeConnectionChange, subscribeDotsRoom } from "./dotsRealtime";
import { DOTS_QUERY_KEYS } from "./queryKeys";

type RoomEventHandlerArgs = Readonly<{
  expectedRoomId: string;
  setRoom: (room: DotsRoomDetail) => void;
  setIsConnected: (value: boolean) => void;
  queryClient: QueryClient;
}>;

type RoomResyncArgs = Readonly<{
  roomId: string;
  queryClient: QueryClient;
  setRoom: (room: DotsRoomDetail) => void;
  cancelledRef: Readonly<{ current: boolean }>;
}>;

type RoomResyncOnResumeArgs = Readonly<{
  roomId: string | null;
  queryClient: QueryClient;
  setRoom: (room: DotsRoomDetail) => void;
  cancelledRef: Readonly<{ current: boolean }>;
}>;

/** Applies a realtime room event to local state and the query cache. */
function onRoomEvent(event: DotsRoomEvent, args: RoomEventHandlerArgs): void {
  if (event.type === "CHAT_MESSAGE" || event.type === "CHAT_READ" || event.type === "CHAT_TYPING") {
    return;
  }
  const { room } = event;
  const { expectedRoomId, setRoom, setIsConnected, queryClient } = args;
  if (room.id !== expectedRoomId) {
    return;
  }
  setRoom(room);
  setIsConnected(true);
  queryClient.setQueryData(DOTS_QUERY_KEYS.room(room.id), room);
}

/** Refetches authoritative room state and forces a WebSocket reconnect. */
function resyncRoomLive(args: RoomResyncArgs): void {
  void args.queryClient
    .fetchQuery({ queryKey: DOTS_QUERY_KEYS.room(args.roomId), queryFn: () => fetchRoom(args.roomId) })
    .then((snapshot) => {
      if (!args.cancelledRef.current) {
        args.setRoom(snapshot);
      }
    });
  forceReconnectDotsRealtime();
}

/** Runs resync when the document becomes visible again. */
function onDocumentVisible(args: RoomResyncArgs): void {
  if (document.visibilityState !== "visible") {
    return;
  }
  resyncRoomLive(args);
}

/** Registers visibility and online listeners to resync room state on resume. */
function useRoomResyncOnResume(args: RoomResyncOnResumeArgs): void {
  const { roomId, queryClient, setRoom, cancelledRef } = args;
  useEffect(() => {
    if (!roomId) {
      return undefined;
    }
    const resyncArgs: RoomResyncArgs = { roomId, queryClient, setRoom, cancelledRef };

    const onVisibilityChange = (): void => onDocumentVisible(resyncArgs);
    const onOnline = (): void => resyncRoomLive(resyncArgs);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
    };
  }, [roomId, queryClient, setRoom, cancelledRef]);
}

/** Subscribes to live updates for `roomId` and exposes the latest snapshot. */
export function useRoomLive(roomId: string | null): UseRoomLiveResult {
  const [room, setRoom] = useState<DotsRoomDetail | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const cancelledRef = useRef(false);

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

    cancelledRef.current = false;

    const cached = queryClient.getQueryData<DotsRoomDetail>(DOTS_QUERY_KEYS.room(roomId));
    setRoom(cached ?? null);
    setIsConnected(false);

    if (!cached) {
      void queryClient
        .fetchQuery({
          queryKey: DOTS_QUERY_KEYS.room(roomId),
          queryFn: () => fetchRoom(roomId)
        })
        .then((snapshot) => {
          if (!cancelledRef.current) {
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
    const unsubscribeRoom = subscribeDotsRoom(roomId, (event) => onRoomEvent(event, args));
    const unsubscribeConnection = onDotsRealtimeConnectionChange(setIsConnected);

    return () => {
      cancelledRef.current = true;
      unsubscribeRoom();
      unsubscribeConnection();
      setIsConnected(false);
    };
  }, [roomId, queryClient]);

  useRoomResyncOnResume({ roomId, queryClient, setRoom, cancelledRef });

  return { room, isConnected, applyRoomSnapshot };
}
