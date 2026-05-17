"use client";

import type { QueryClient } from "@tanstack/react-query";

import type {
  CreateRoomRequest,
  DotsRoomDetail,
  DotsRoomSummary,
  JoinRoomRequest,
  LeaveRoomRequest
} from "../api/dotsOnlineApiTypes";
import { DOTS_QUERY_KEYS } from "../api/queryKeys";
import type { CreateRoomDraft } from "../ui/online/DotsOnlineRoomSetup";
import type { DotsOnlineIdentity } from "./useOnlineIdentity";
import { DotsOnlineViewKind, type DotsOnlineView, type PendingJoin } from "./orchestratorTypes";

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

/** Persists the entered name and closes the name modal. */
export function submitName({
  name,
  setDisplayName,
  setIsNameModalOpen
}: Readonly<{
  name: string;
  setDisplayName: (name: string) => Promise<void>;
  setIsNameModalOpen: (open: boolean) => void;
}>): void {
  void setDisplayName(name).then(() => {
    setIsNameModalOpen(false);
  });
}

/** Closes the name modal unless the user has not yet picked a name (the modal is required then). */
export function closeNameModal({
  isRequired,
  setIsNameModalOpen
}: Readonly<{
  isRequired: boolean;
  setIsNameModalOpen: (open: boolean) => void;
}>): void {
  if (isRequired) {
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
  queryClient,
  joinRoom,
  setIsNameModalOpen,
  setPendingJoin,
  setJoinError
}: Readonly<{
  roomId: string;
  identity: DotsOnlineIdentity | null;
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
  const isProtected = summary?.hasPassword === true;
  const isPlaying = summary?.status === "playing";
  const isFinished = summary?.status === "finished";
  const asViewer = Boolean(isPlaying) || Boolean(isFinished);
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

/** Fires the leave mutation when leaving active gameplay; otherwise navigates straight back. */
export function exitGame({
  view,
  identity,
  leaveRoom,
  setView
}: Readonly<{
  view: DotsOnlineView;
  identity: DotsOnlineIdentity | null;
  leaveRoom: (args: Readonly<{ roomId: string; request: LeaveRoomRequest }>) => void;
  setView: (view: DotsOnlineView) => void;
}>): void {
  if (view.kind !== DotsOnlineViewKind.Play || !identity) {
    setView({ kind: DotsOnlineViewKind.List });
    return;
  }
  leaveRoom({ roomId: view.roomId, request: { userId: identity.userId } });
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
