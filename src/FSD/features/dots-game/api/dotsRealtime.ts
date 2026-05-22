import type { DotsLocalState } from "../model/localState";
import type { DotsRoomEvent } from "./dotsOnlineApiTypes";
import { LocalStorageKey } from "@/FSD/shared/lib/local-storage/localStorageKey";
import { readStoredString } from "@/FSD/shared/lib/local-storage/localStorage";

type RoomListener = (event: DotsRoomEvent) => void;

let socket: WebSocket | null = null;
let connectToken: string | null = null;
const roomListeners = new Map<string, Set<RoomListener>>();

/** Resolves the WebSocket URL for the dots realtime gateway. */
function wsBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_DOTS_WS_URL;
  if (explicit) {
    return explicit;
  }
  if (typeof window === "undefined") {
    return "";
  }
  const apiBase = process.env.NEXT_PUBLIC_DOTS_API_BASE ?? "/dots";
  if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
    const httpUrl = new URL(apiBase.endsWith("/") ? apiBase : `${apiBase}/`);
    httpUrl.pathname = `${httpUrl.pathname.replace(/\/$/, "")}/ws`;
    httpUrl.protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
    return httpUrl.toString();
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/dots/ws`;
}

/** Sends a JSON payload on the open WebSocket when connected. */
function sendJson(payload: unknown): void {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

/** Re-sends SUBSCRIBE for every room with active listeners. */
function subscribeAllRooms(): void {
  for (const roomId of roomListeners.keys()) {
    sendJson({ type: "SUBSCRIBE", roomId });
  }
}

/** Authenticates the WebSocket and re-subscribes to all active rooms. */
function onSocketOpen(token: string): void {
  sendJson({ type: "AUTH", token });
  subscribeAllRooms();
}

/** Dispatches a parsed room event to all listeners for that room. */
function onSocketMessage(event: MessageEvent): void {
  try {
    const parsed = JSON.parse(String(event.data)) as DotsRoomEvent;
    if (!parsed.room?.id) {
      return;
    }
    const listeners = roomListeners.get(parsed.room.id);
    if (!listeners) {
      return;
    }
    for (const listener of listeners) {
      listener(parsed);
    }
  } catch {
    /* ignore */
  }
}

/** Ensures a WebSocket is connected and authenticated for the current token. */
function ensureSocket(): WebSocket | null {
  const token = readStoredString(LocalStorageKey.DotsOnlineSessionToken);
  if (!token || typeof window === "undefined") {
    return null;
  }
  if (socket && connectToken === token && socket.readyState <= WebSocket.OPEN) {
    return socket;
  }
  socket?.close();
  connectToken = token;
  const ws = new WebSocket(wsBaseUrl());
  socket = ws;
  ws.addEventListener("open", () => onSocketOpen(token));
  ws.addEventListener("message", onSocketMessage);
  return ws;
}

/** Subscribes to live room events; returns unsubscribe. */
export function subscribeDotsRoom(roomId: string, listener: RoomListener): () => void {
  ensureSocket();
  let set = roomListeners.get(roomId);
  if (!set) {
    set = new Set();
    roomListeners.set(roomId, set);
  }
  set.add(listener);
  sendJson({ type: "SUBSCRIBE", roomId });

  return () => {
    set?.delete(listener);
    if (set && set.size === 0) {
      roomListeners.delete(roomId);
    }
  };
}

/** Sends ephemeral presence for the acting player. */
export function sendDotsPresence(roomId: string, patch: DotsLocalState): void {
  ensureSocket();
  sendJson({ type: "PRESENCE", roomId, patch });
}
