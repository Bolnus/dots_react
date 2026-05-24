import type { DotsLocalState } from "../model/localState";
import type { DotsRoomEvent } from "./dotsOnlineApiTypes";
import { LocalStorageKey } from "@/FSD/shared/lib/local-storage/localStorageKey";
import { readStoredString } from "@/FSD/shared/lib/local-storage/localStorage";

type RoomListener = (event: DotsRoomEvent) => void;
type ConnectionListener = (connected: boolean) => void;

const RECONNECT_DELAYS_MS = [1000, 2000, 5000] as const;

let socket: WebSocket | null = null;
let connectToken: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let suppressReconnect = false;
const roomListeners = new Map<string, Set<RoomListener>>();
const connectionListeners = new Set<ConnectionListener>();

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

/** Notifies subscribers when the WebSocket connection state changes. */
function notifyConnectionChange(connected: boolean): void {
  for (const listener of connectionListeners) {
    listener(connected);
  }
}

/** Clears a pending reconnect timer, if any. */
function clearReconnectTimer(): void {
  if (reconnectTimer === null) {
    return;
  }
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
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

/** Handles a successful WebSocket open: resets backoff and authenticates. */
function onWebSocketOpen(token: string): void {
  reconnectAttempt = 0;
  onSocketOpen(token);
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

/** Creates and wires a new WebSocket for the stored session token. */
function createSocket(): void {
  const token = readStoredString(LocalStorageKey.DotsOnlineSessionToken);
  if (!token || typeof window === "undefined") {
    return;
  }
  connectToken = token;
  const ws = new WebSocket(wsBaseUrl());
  socket = ws;
  ws.addEventListener("open", () => onWebSocketOpen(token));
  ws.addEventListener("message", onSocketMessage);
  ws.addEventListener("close", onSocketClose);
  ws.addEventListener("error", () => ws.close());
}

/** Runs when a scheduled reconnect timer fires. */
function onReconnectTimerFired(): void {
  reconnectTimer = null;
  createSocket();
}

/** Schedules a delayed reconnect when rooms still have active listeners. */
function scheduleReconnect(): void {
  if (roomListeners.size === 0 || reconnectTimer !== null) {
    return;
  }
  const delay = RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(onReconnectTimerFired, delay);
}

/** Handles WebSocket close by marking disconnected and scheduling a reconnect. */
function onSocketClose(): void {
  socket = null;
  notifyConnectionChange(false);
  if (suppressReconnect) {
    suppressReconnect = false;
    return;
  }
  scheduleReconnect();
}

/** Ensures a WebSocket is connected and authenticated for the current token. */
function ensureSocket(): WebSocket | null {
  const token = readStoredString(LocalStorageKey.DotsOnlineSessionToken);
  if (!token || typeof window === "undefined") {
    return null;
  }
  if (socket && connectToken === token && socket.readyState === WebSocket.OPEN) {
    return socket;
  }
  if (socket && connectToken === token && socket.readyState === WebSocket.CONNECTING) {
    return socket;
  }
  socket?.close();
  socket = null;
  createSocket();
  return socket;
}

/** Closes the socket and immediately opens a fresh connection with all subscriptions. */
export function forceReconnectDotsRealtime(): void {
  if (typeof window === "undefined") {
    return;
  }
  clearReconnectTimer();
  reconnectAttempt = 0;
  suppressReconnect = true;
  socket?.close();
  socket = null;
  createSocket();
  subscribeAllRooms();
}

/** Subscribes to WebSocket connection state changes; returns unsubscribe. */
export function onDotsRealtimeConnectionChange(listener: ConnectionListener): () => void {
  connectionListeners.add(listener);
  return () => connectionListeners.delete(listener);
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
