"use client";

import type { QueryClient } from "@tanstack/react-query";

import type {
  CreateRoomRequest,
  DotsRoomDetail,
  DotsRoomSummary,
  DotsSessionActiveRoom,
  JoinRoomRequest
} from "../api/dotsOnlineApiTypes";
import { DOTS_QUERY_KEYS } from "../api/queryKeys";
import type { CreateRoomDraft } from "../ui/online/DotsOnlineRoomSetup/types";
import type { DotsOnlineIdentity } from "./onlineIdentityTypes";
import { DotsOnlineViewKind, type DotsOnlineView, type PendingJoin } from "./orchestratorTypes";

/** True when the user is one of the locked players in the room snapshot. */
export function isUserLockedPlayer(room: DotsRoomDetail, userId: string): boolean {
  return room.lockedPlayers.player0 === userId || room.lockedPlayers.player1 === userId;
}

/** Picks whether a join should enter as viewer for the given room context. */
export function resolveJoinAsViewer({
  roomId,
  userId,
  activeRoom,
  summary,
  roomDetail
}: Readonly<{
  roomId: string;
  userId: string;
  activeRoom: DotsSessionActiveRoom | null | undefined;
  summary: DotsRoomSummary | null;
  roomDetail: DotsRoomDetail | null;
}>): boolean {
  if (activeRoom?.id === roomId && activeRoom.status === "playing") {
    return false;
  }
  if (roomDetail && isUserLockedPlayer(roomDetail, userId)) {
    return false;
  }
  const isPlaying = summary?.status === "playing";
  const isFinished = summary?.status === "finished";
  return Boolean(isPlaying) || Boolean(isFinished);
}

/** Looks up a room summary from the cached rooms list (no network round-trip). */
export function findRoomSummary(cached: DotsRoomSummary[] | undefined, roomId: string): DotsRoomSummary | null {
  if (!cached) {
    return null;
  }
  return cached.find((entry) => entry.id === roomId) ?? null;
}

/** Picks the active room id when the view is bound to a specific room. */
export function pickActiveRoomId(view: DotsOnlineView): string | null {
  if (view.kind === DotsOnlineViewKind.Room || view.kind === DotsOnlineViewKind.Play) {
    return view.roomId;
  }
  return null;
}

/** Persists the entered name and closes the name modal on success. */
export async function submitName({
  name,
  setDisplayName,
  setIsNameModalOpen
}: Readonly<{
  name: string;
  setDisplayName: (name: string) => Promise<void>;
  setIsNameModalOpen: (open: boolean) => void;
}>): Promise<string | null> {
  try {
    await setDisplayName(name);
    setIsNameModalOpen(false);
    return null;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return null;
  }
}

/** Closes the name modal or returns to the lobby when entry is required. */
export function closeNameModal({
  isRequired,
  setIsNameModalOpen,
  onBackToLobby
}: Readonly<{
  isRequired: boolean;
  setIsNameModalOpen: (open: boolean) => void;
  onBackToLobby: () => void;
}>): void {
  if (isRequired) {
    onBackToLobby();
    return;
  }
  setIsNameModalOpen(false);
}

/** Fires the join mutation; the result is handled declaratively by effects in `DotsOnlineSetup`. */
export function performJoin({
  pending,
  password,
  userId,
  displayName,
  joinRoom,
  setJoinError
}: Readonly<{
  pending: PendingJoin;
  password: string | undefined;
  userId: string;
  displayName: string;
  joinRoom: (args: Readonly<{ roomId: string; request: JoinRoomRequest }>) => void;
  setJoinError: (value: string | null) => void;
}>): void {
  setJoinError(null);
  joinRoom({
    roomId: pending.roomId,
    request: {
      userId,
      displayName,
      asViewer: pending.asViewer,
      password
    }
  });
}

/** Resolves a clicked room: prompts for password when private, otherwise joins immediately. */
export function openRoom({
  roomId,
  identity,
  activeRoom,
  queryClient,
  joinRoom,
  setIsNameModalOpen,
  setPendingJoin,
  setJoinError
}: Readonly<{
  roomId: string;
  identity: DotsOnlineIdentity | null;
  activeRoom: DotsSessionActiveRoom | null | undefined;
  queryClient: QueryClient;
  joinRoom: (args: Readonly<{ roomId: string; request: JoinRoomRequest }>) => void;
  setIsNameModalOpen: (open: boolean) => void;
  setPendingJoin: (value: PendingJoin | null) => void;
  setJoinError: (value: string | null) => void;
}>): void {
  if (!identity?.displayName) {
    setIsNameModalOpen(true);
    return;
  }
  const cached = queryClient.getQueryData<DotsRoomSummary[]>(DOTS_QUERY_KEYS.roomsList);
  const summary = findRoomSummary(cached, roomId);
  const roomDetail = queryClient.getQueryData<DotsRoomDetail>(DOTS_QUERY_KEYS.room(roomId)) ?? null;
  const isProtected = summary?.hasPassword === true;
  const asViewer = resolveJoinAsViewer({
    roomId,
    userId: identity.userId,
    activeRoom,
    summary,
    roomDetail
  });
  const pending: PendingJoin = { roomId, asViewer, needsPassword: isProtected };
  setJoinError(null);
  if (isProtected) {
    setPendingJoin(pending);
    return;
  }
  performJoin({
    pending,
    password: undefined,
    userId: identity.userId,
    displayName: identity.displayName,
    joinRoom,
    setJoinError
  });
}

/** Attempts to rejoin an active game without prompting (skips password-protected rooms). */
export function tryAutoReconnectActiveGame({
  roomId,
  identity,
  queryClient,
  joinRoom
}: Readonly<{
  roomId: string;
  identity: DotsOnlineIdentity;
  queryClient: QueryClient;
  joinRoom: (args: Readonly<{ roomId: string; request: JoinRoomRequest }>) => void;
}>): void {
  const cached = queryClient.getQueryData<DotsRoomSummary[]>(DOTS_QUERY_KEYS.roomsList);
  const summary = findRoomSummary(cached, roomId);
  const roomDetail = queryClient.getQueryData<DotsRoomDetail>(DOTS_QUERY_KEYS.room(roomId)) ?? null;
  const isProtected = roomDetail?.hasPassword === true || summary?.hasPassword === true;
  if (isProtected) {
    return;
  }
  performJoin({
    pending: { roomId, asViewer: false, needsPassword: false },
    password: undefined,
    userId: identity.userId,
    displayName: identity.displayName,
    joinRoom,
    setJoinError: () => undefined
  });
}

/** Rejoins an in-progress game as the locked player (not as viewer). */
export function reconnectActiveGame({
  roomId,
  identity,
  queryClient,
  joinRoom,
  setPendingJoin,
  setJoinError
}: Readonly<{
  roomId: string;
  identity: DotsOnlineIdentity;
  queryClient: QueryClient;
  joinRoom: (args: Readonly<{ roomId: string; request: JoinRoomRequest }>) => void;
  setPendingJoin: (value: PendingJoin | null) => void;
  setJoinError: (value: string | null) => void;
}>): void {
  const cached = queryClient.getQueryData<DotsRoomSummary[]>(DOTS_QUERY_KEYS.roomsList);
  const summary = findRoomSummary(cached, roomId);
  const roomDetail = queryClient.getQueryData<DotsRoomDetail>(DOTS_QUERY_KEYS.room(roomId)) ?? null;
  const isProtected = roomDetail?.hasPassword === true || summary?.hasPassword === true;
  const pending: PendingJoin = { roomId, asViewer: false, needsPassword: isProtected };
  setJoinError(null);
  if (isProtected) {
    setPendingJoin(pending);
    return;
  }
  performJoin({
    pending,
    password: undefined,
    userId: identity.userId,
    displayName: identity.displayName,
    joinRoom,
    setJoinError
  });
}

/** Fires the create-room mutation; downstream effects route to the new room. */
export function createRoomFromDraft({
  draft,
  identity,
  createRoom
}: Readonly<{
  draft: CreateRoomDraft;
  identity: DotsOnlineIdentity;
  createRoom: (request: CreateRoomRequest) => void;
}>): void {
  if (!identity.displayName) {
    return;
  }
  const trimmedName = draft.name.trim();
  const trimmedPassword = draft.password.trim();
  createRoom({
    name: trimmedName || `${identity.displayName}'s room`,
    ownerUserId: identity.userId,
    ownerName: identity.displayName,
    config: { rows: draft.config.rows, cols: draft.config.cols },
    isPrivate: trimmedPassword.length > 0,
    password: trimmedPassword
  });
}

/** Routes the joined room snapshot into the appropriate online view (lobby or active game). */
export function routeJoinedRoom({
  room,
  setView
}: Readonly<{
  room: DotsRoomDetail;
  setView: (view: DotsOnlineView) => void;
}>): void {
  if (room.status === "waiting") {
    setView({ kind: DotsOnlineViewKind.Room, roomId: room.id });
    return;
  }
  setView({ kind: DotsOnlineViewKind.Play, roomId: room.id });
}

/** Navigates back to the rooms list without leaving an in-progress game. */
export function exitGame({
  view,
  setView
}: Readonly<{
  view: DotsOnlineView;
  setView: (view: DotsOnlineView) => void;
}>): void {
  if (view.kind !== DotsOnlineViewKind.Play) {
    setView({ kind: DotsOnlineViewKind.List });
    return;
  }
  setView({ kind: DotsOnlineViewKind.List });
}

/** Submits the password from the join modal (no-op when identity is missing). */
export function submitJoinPassword({
  password,
  pending,
  identity,
  joinRoom,
  setJoinError
}: Readonly<{
  password: string;
  pending: PendingJoin;
  identity: DotsOnlineIdentity | null;
  joinRoom: (args: Readonly<{ roomId: string; request: JoinRoomRequest }>) => void;
  setJoinError: (value: string | null) => void;
}>): void {
  if (!identity?.displayName) {
    return;
  }
  performJoin({
    pending,
    password,
    userId: identity.userId,
    displayName: identity.displayName,
    joinRoom,
    setJoinError
  });
}

/** Opens the name modal if a name is missing; otherwise routes to the room-draft view. */
export function requestCreateRoom({
  displayName,
  setIsNameModalOpen,
  setView
}: Readonly<{
  displayName: string | null | undefined;
  setIsNameModalOpen: (open: boolean) => void;
  setView: (view: DotsOnlineView) => void;
}>): void {
  if (!displayName) {
    setIsNameModalOpen(true);
    return;
  }
  setView({ kind: DotsOnlineViewKind.RoomDraft });
}

/** Closes the join-password modal and clears any in-flight error. */
export function closeJoinModal({
  setPendingJoin,
  setJoinError
}: Readonly<{
  setPendingJoin: (value: PendingJoin | null) => void;
  setJoinError: (value: string | null) => void;
}>): void {
  setPendingJoin(null);
  setJoinError(null);
}
