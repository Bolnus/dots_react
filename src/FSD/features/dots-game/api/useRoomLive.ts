"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

import type { DotsRoomDetail, DotsRoomEvent, UseRoomLiveOptions, UseRoomLiveResult } from "./dotsOnlineApiTypes";
import { fetchRoom } from "./dotsApi";
import { forceReconnectDotsRealtime, onDotsRealtimeConnectionChange, subscribeDotsRoom } from "./dotsRealtime";
import { DOTS_QUERY_KEYS } from "./queryKeys";

type RoomEventHandlerArgs = Readonly<{
  expectedRoomId: string;
  setRoom: Dispatch<SetStateAction<DotsRoomDetail | null>>;
  setIsConnected: (value: boolean) => void;
  queryClient: QueryClient;
}>;

type RoomResyncArgs = Readonly<{
  roomId: string;
  queryClient: QueryClient;
  setRoom: Dispatch<SetStateAction<DotsRoomDetail | null>>;
  cancelledRef: Readonly<{ current: boolean }>;
}>;

type RoomResyncOnResumeArgs = Readonly<{
  roomId: string | null;
  queryClient: QueryClient;
  setRoom: Dispatch<SetStateAction<DotsRoomDetail | null>>;
  cancelledRef: Readonly<{ current: boolean }>;
}>;

type MergeIncomingRoomSnapshotArgs = Readonly<{
  prev: DotsRoomDetail | null;
  next: DotsRoomDetail;
  shouldApplyRoomEvent?: (prev: DotsRoomDetail | null, next: DotsRoomDetail) => boolean;
  outcome: { applied: boolean };
}>;

/** Merges an incoming WS room snapshot into the current live state. */
function mergeIncomingRoomSnapshot(args: MergeIncomingRoomSnapshotArgs): DotsRoomDetail | null {
  if (args.shouldApplyRoomEvent && !args.shouldApplyRoomEvent(args.prev, args.next)) {
    args.outcome.applied = false;
    return args.prev;
  }
  args.outcome.applied = true;
  return args.next;
}

/** Applies a realtime room event to local state and the query cache. */
function onRoomEvent(
  event: DotsRoomEvent,
  args: RoomEventHandlerArgs,
  shouldApplyRoomEvent?: (prev: DotsRoomDetail | null, next: DotsRoomDetail) => boolean
): void {
  if (event.type === "CHAT_MESSAGE" || event.type === "CHAT_READ" || event.type === "CHAT_TYPING") {
    return;
  }
  const { room: next } = event;
  const { expectedRoomId, setRoom, setIsConnected, queryClient } = args;
  if (next.id !== expectedRoomId) {
    return;
  }
  const outcome = { applied: false };
  setRoom((prev) => mergeIncomingRoomSnapshot({ prev, next, shouldApplyRoomEvent, outcome }));
  if (!outcome.applied) {
    return;
  }
  setIsConnected(true);
  queryClient.setQueryData(DOTS_QUERY_KEYS.room(next.id), next);
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
export function useRoomLive(roomId: string | null, options?: UseRoomLiveOptions): UseRoomLiveResult {
  const [room, setRoom] = useState<DotsRoomDetail | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const cancelledRef = useRef(false);
  const shouldApplyRoomEventRef = useRef(options?.shouldApplyRoomEvent);

  useEffect(() => {
    shouldApplyRoomEventRef.current = options?.shouldApplyRoomEvent;
  }, [options?.shouldApplyRoomEvent]);

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
    const unsubscribeRoom = subscribeDotsRoom(roomId, (event) =>
      onRoomEvent(event, args, shouldApplyRoomEventRef.current)
    );
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
