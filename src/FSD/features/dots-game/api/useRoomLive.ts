"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import type { DotsRoomDetail, DotsRoomEvent, UseRoomLiveOptions, UseRoomLiveResult } from "./dotsOnlineApiTypes";
import { fetchRoom } from "./dotsApi";
import { forceReconnectDotsRealtime, onDotsRealtimeConnectionChange, subscribeDotsRoom } from "./dotsRealtime";
import { DOTS_QUERY_KEYS } from "./queryKeys";

type RoomEventHandlerArgs = Readonly<{
  expectedRoomId: string;
  setIsConnected: (value: boolean) => void;
  queryClient: QueryClient;
}>;

type RoomResyncArgs = Readonly<{
  roomId: string;
  queryClient: QueryClient;
}>;

type RoomResyncOnResumeArgs = Readonly<{
  roomId: string | null;
  queryClient: QueryClient;
}>;

type MergeIncomingRoomSnapshotArgs = Readonly<{
  prev: DotsRoomDetail | null;
  next: DotsRoomDetail;
  shouldApplyRoomEvent?: (prev: DotsRoomDetail | null, next: DotsRoomDetail) => boolean;
  outcome: { applied: boolean };
}>;

/** Merges an incoming WS room snapshot into the query cache. */
function mergeIncomingRoomSnapshot(args: MergeIncomingRoomSnapshotArgs): DotsRoomDetail | undefined {
  if (args.shouldApplyRoomEvent && !args.shouldApplyRoomEvent(args.prev, args.next)) {
    args.outcome.applied = false;
    return args.prev ?? undefined;
  }
  args.outcome.applied = true;
  return args.next;
}

/** Applies a realtime room event to the query cache. */
function onRoomEvent(
  event: DotsRoomEvent,
  args: RoomEventHandlerArgs,
  shouldApplyRoomEvent?: (prev: DotsRoomDetail | null, next: DotsRoomDetail) => boolean
): void {
  if (event.type === "CHAT_MESSAGE" || event.type === "CHAT_READ" || event.type === "CHAT_TYPING") {
    return;
  }
  const { room: next } = event;
  const { expectedRoomId, setIsConnected, queryClient } = args;
  if (next.id !== expectedRoomId) {
    return;
  }
  const outcome = { applied: false };
  queryClient.setQueryData<DotsRoomDetail>(DOTS_QUERY_KEYS.room(next.id), (prev) =>
    mergeIncomingRoomSnapshot({ prev: prev ?? null, next, shouldApplyRoomEvent, outcome })
  );
  if (!outcome.applied) {
    return;
  }
  setIsConnected(true);
}

/** Refetches authoritative room state and forces a WebSocket reconnect. */
function resyncRoomLive(args: RoomResyncArgs): void {
  void args.queryClient.fetchQuery({
    queryKey: DOTS_QUERY_KEYS.room(args.roomId),
    queryFn: () => fetchRoom(args.roomId),
    staleTime: Number.POSITIVE_INFINITY
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
  const { roomId, queryClient } = args;
  useEffect(() => {
    if (!roomId) {
      return undefined;
    }
    const resyncArgs: RoomResyncArgs = { roomId, queryClient };

    const onVisibilityChange = (): void => onDocumentVisible(resyncArgs);
    const onOnline = (): void => resyncRoomLive(resyncArgs);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
    };
  }, [roomId, queryClient]);
}

/** Subscribes to live updates for `roomId` and exposes the latest snapshot from the query cache. */
export function useRoomLive(roomId: string | null, options?: UseRoomLiveOptions): UseRoomLiveResult {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const shouldApplyRoomEventRef = useRef(options?.shouldApplyRoomEvent);

  useEffect(() => {
    shouldApplyRoomEventRef.current = options?.shouldApplyRoomEvent;
  }, [options?.shouldApplyRoomEvent]);

  const { data: room } = useQuery({
    queryKey: DOTS_QUERY_KEYS.room(roomId ?? "__none__"),
    queryFn: () => fetchRoom(roomId!),
    enabled: roomId !== null,
    staleTime: Number.POSITIVE_INFINITY
  });

  const applyRoomSnapshot = useCallback(
    (snapshot: DotsRoomDetail): void => {
      if (!roomId || snapshot.id !== roomId) {
        return;
      }
      queryClient.setQueryData(DOTS_QUERY_KEYS.room(snapshot.id), snapshot);
    },
    [roomId, queryClient]
  );

  useEffect(() => {
    if (!roomId) {
      setIsConnected(false);
      return undefined;
    }

    setIsConnected(false);

    const args: RoomEventHandlerArgs = {
      expectedRoomId: roomId,
      setIsConnected,
      queryClient
    };
    const unsubscribeRoom = subscribeDotsRoom(roomId, (event) =>
      onRoomEvent(event, args, shouldApplyRoomEventRef.current)
    );
    const unsubscribeConnection = onDotsRealtimeConnectionChange(setIsConnected);

    return () => {
      unsubscribeRoom();
      unsubscribeConnection();
      setIsConnected(false);
    };
  }, [roomId, queryClient]);

  useRoomResyncOnResume({ roomId, queryClient });

  return { room: room ?? null, isConnected, applyRoomSnapshot };
}
