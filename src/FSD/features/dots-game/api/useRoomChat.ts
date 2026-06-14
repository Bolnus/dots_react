"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { DotsChatMessage, DotsChatReadState, DotsRoomEvent } from "./dotsOnlineApiTypes";
import { fetchChatMessages, postChatMessage, postChatRead } from "./dotsApi";
import { sendChatTyping, subscribeDotsRoom } from "./dotsRealtime";
import { DOTS_QUERY_KEYS } from "./queryKeys";
import type { UseRoomChatResult } from "./roomChatTypes";

const TYPING_TTL_MS = 4000;
const TYPING_SEND_MIN_INTERVAL_MS = 2000;

type TypingUser = Readonly<{ userId: string; displayName: string; expiresAt: number }>;

/** Merges messages by id, preserving ascending createdAt order. */
function mergeMessages(existing: readonly DotsChatMessage[], incoming: readonly DotsChatMessage[]): DotsChatMessage[] {
  const byId = new Map<string, DotsChatMessage>();
  for (const message of existing) {
    byId.set(message.id, message);
  }
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort((a, b) => a.createdAtMs - b.createdAtMs);
}

/** Applies a chat read event to the previous read state list. */
function applyChatReadUpdate(prev: DotsChatReadState[], userId: string, lastReadAtMs: number): DotsChatReadState[] {
  const next = prev.filter((state) => state.userId !== userId);
  return [...next, { userId, lastReadAtMs }];
}

/** Applies a chat typing event to the previous typing user list. */
function applyChatTypingUpdate(prev: TypingUser[], userId: string, displayName: string): TypingUser[] {
  const expiresAt = Date.now() + TYPING_TTL_MS;
  const filtered = prev.filter((entry) => entry.userId !== userId);
  return [...filtered, { userId, displayName, expiresAt }];
}

/** Creates a room event handler for chat-specific WS events. */
function createChatEventHandler(
  roomId: string,
  userId: string,
  setMessages: Dispatch<SetStateAction<DotsChatMessage[]>>,
  setReadStates: Dispatch<SetStateAction<DotsChatReadState[]>>,
  setTypingUsers: Dispatch<SetStateAction<TypingUser[]>>
): (event: DotsRoomEvent) => void {
  return (event: DotsRoomEvent): void => {
    if (event.type === "CHAT_MESSAGE" && event.roomId === roomId) {
      setMessages((prev) => mergeMessages(prev, [event.message]));
      return;
    }
    if (event.type === "CHAT_READ" && event.roomId === roomId) {
      setReadStates((prev) => applyChatReadUpdate(prev, event.userId, event.lastReadAtMs));
      return;
    }
    if (event.type === "CHAT_TYPING" && event.roomId === roomId && event.userId !== userId) {
      setTypingUsers((prev) => applyChatTypingUpdate(prev, event.userId, event.displayName));
    }
  };
}

/** Merges fetched read states into the existing list. */
function mergeReadStates(
  prev: readonly DotsChatReadState[],
  incoming: readonly DotsChatReadState[]
): DotsChatReadState[] {
  const byUser = new Map(prev.map((state) => [state.userId, state]));
  for (const state of incoming) {
    byUser.set(state.userId, state);
  }
  return [...byUser.values()];
}

/** Removes expired typing entries. */
function expireStaleTypers(prev: TypingUser[], now: number): TypingUser[] {
  return prev.filter((entry) => entry.expiresAt > now);
}

/** Updates local read state after a successful mark-read mutation. */
function handleMarkReadSuccess(
  userId: string,
  setLastMarkedReadAt: Dispatch<SetStateAction<number>>,
  setReadStates: Dispatch<SetStateAction<DotsChatReadState[]>>,
  lastReadAtMs: number
): void {
  setLastMarkedReadAt(lastReadAtMs);
  setReadStates((prev) => applyChatReadUpdate(prev, userId, lastReadAtMs));
}

/** Subscribes to room chat events and updates local chat state. */
function useRoomChatEvents(
  roomId: string | null,
  userId: string,
  setMessages: Dispatch<SetStateAction<DotsChatMessage[]>>,
  setReadStates: Dispatch<SetStateAction<DotsChatReadState[]>>,
  setTypingUsers: Dispatch<SetStateAction<TypingUser[]>>
): void {
  useEffect(() => {
    if (!roomId) {
      return undefined;
    }
    const onEvent = createChatEventHandler(roomId, userId, setMessages, setReadStates, setTypingUsers);
    return subscribeDotsRoom(roomId, onEvent);
  }, [roomId, userId, setMessages, setReadStates, setTypingUsers]);
}

/** Loads and manages room chat messages, read state, and typing indicators. */
export function useRoomChat(roomId: string | null, userId: string, isSecondaryVisible: boolean): UseRoomChatResult {
  const [messages, setMessages] = useState<DotsChatMessage[]>([]);
  const [readStates, setReadStates] = useState<DotsChatReadState[]>([]);
  const [hasMoreBefore, setHasMoreBefore] = useState(false);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [lastMarkedReadAt, setLastMarkedReadAt] = useState(0);
  const lastTypingSentAtRef = useRef(0);

  const { isLoading, data } = useQuery({
    queryKey: DOTS_QUERY_KEYS.chatMessages(roomId ?? ""),
    queryFn: () => fetchChatMessages(roomId!),
    enabled: roomId !== null
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    setMessages([...data.messages]);
    setReadStates([...data.readStates]);
    setHasMoreBefore(data.hasMoreBefore);
    const ownRead = data.readStates.find((state) => state.userId === userId)?.lastReadAtMs ?? 0;
    setLastMarkedReadAt(ownRead);
  }, [data, userId]);

  useRoomChatEvents(roomId, userId, setMessages, setReadStates, setTypingUsers);

  useEffect(() => {
    if (typingUsers.length === 0) {
      return undefined;
    }
    const timer = setInterval(() => setTypingUsers((prev) => expireStaleTypers(prev, Date.now())), 500);
    return () => clearInterval(timer);
  }, [typingUsers.length]);

  const { mutate: sendMessageMutate, isPending: isSending } = useMutation({
    mutationFn: (content: string) => postChatMessage(roomId!, content),
    onSuccess: (message) => setMessages((prev) => mergeMessages(prev, [message]))
  });

  const { mutate: markReadMutate } = useMutation({
    mutationFn: (lastReadAtMs: number) => postChatRead(roomId!, lastReadAtMs),
    onSuccess: (_void, lastReadAtMs) => handleMarkReadSuccess(userId, setLastMarkedReadAt, setReadStates, lastReadAtMs)
  });

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMessageAt = lastMessage?.createdAtMs ?? 0;

  const hasUnread =
    !isSecondaryVisible &&
    messages.some((message) => message.senderUserId !== userId && message.createdAtMs > lastMarkedReadAt);

  useEffect(() => {
    if (!isSecondaryVisible || !roomId || lastMessageAt <= lastMarkedReadAt) {
      return;
    }
    markReadMutate(lastMessageAt);
  }, [isSecondaryVisible, lastMessageAt, lastMarkedReadAt, roomId, markReadMutate]);

  const loadOlderMessages = useCallback((): void => {
    const [oldest] = messages;
    if (!roomId || !hasMoreBefore || isFetchingOlder || oldest === undefined) {
      return;
    }
    setIsFetchingOlder(true);
    void fetchChatMessages(roomId, { beforeMs: oldest.createdAtMs })
      .then((result) => {
        setMessages((prev) => mergeMessages(result.messages, prev));
        setHasMoreBefore(result.hasMoreBefore);
        setReadStates((prev) => mergeReadStates(prev, result.readStates));
      })
      .finally(() => {
        setIsFetchingOlder(false);
      });
  }, [roomId, hasMoreBefore, isFetchingOlder, messages]);

  const sendMessage = (content: string): void => {
    if (!roomId) {
      return;
    }
    sendMessageMutate(content);
  };

  const notifyTyping = (): void => {
    if (!roomId) {
      return;
    }
    const now = Date.now();
    if (now - lastTypingSentAtRef.current < TYPING_SEND_MIN_INTERVAL_MS) {
      return;
    }
    lastTypingSentAtRef.current = now;
    sendChatTyping(roomId);
  };

  return {
    messages,
    readStates,
    hasMoreBefore,
    isLoading,
    isFetchingOlder,
    isSending,
    hasUnread,
    typingUsers,
    loadOlderMessages,
    sendMessage,
    notifyTyping
  };
}

/** Returns whether an own message has been read by the opponent. */
export function isOwnMessageRead(
  message: DotsChatMessage,
  ownUserId: string,
  opponentUserId: string | null,
  readStates: readonly DotsChatReadState[]
): boolean {
  if (message.senderUserId !== ownUserId || opponentUserId === null) {
    return false;
  }
  return (readStates.find((state) => state.userId === opponentUserId)?.lastReadAtMs ?? 0) >= message.createdAtMs;
}
