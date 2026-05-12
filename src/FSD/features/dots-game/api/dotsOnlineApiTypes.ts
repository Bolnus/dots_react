import type { DotsLocalState } from "../model/localState";
import type { DotsServerAction } from "../model/serverReducer";
import type { DotsServerGameState } from "../model/serverState";
import type { DotsGameConfig, PlayerId } from "../model/types";

/** Lifecycle status of a room exposed to clients. */
export type DotsRoomStatus = "waiting" | "playing" | "finished";

/** Slot the user occupies in the room (game-playing slots or spectator). */
export type DotsRoomSlot = PlayerId | "viewer";

/** Connected user as seen by other clients in a room. */
export type DotsOnlineUser = Readonly<{
  userId: string;
  displayName: string;
}>;

/** Snapshot of a single room shown in the rooms list. */
export type DotsRoomSummary = Readonly<{
  id: string;
  name: string;
  ownerUserId: string;
  ownerName: string;
  isPrivate: boolean;
  hasPassword: boolean;
  config: DotsGameConfig;
  status: DotsRoomStatus;
  playerCount: number;
  /** Maximum players for the dots game (always 2). */
  maxPlayers: number;
  viewerCount: number;
  createdAtMs: number;
}>;

/** Live, full-detail room snapshot delivered over the realtime channel. */
export type DotsRoomDetail = Readonly<{
  id: string;
  name: string;
  ownerUserId: string;
  isPrivate: boolean;
  hasPassword: boolean;
  status: DotsRoomStatus;
  players: readonly { slot: PlayerId; user: DotsOnlineUser }[];
  viewers: readonly DotsOnlineUser[];
  config: DotsGameConfig;
  /** Authoritative game state once the room has been started; `null` while waiting. */
  serverState: DotsServerGameState | null;
  /** Active player's in-flight UI state (broadcast verbatim; not part of the hash). */
  presence: DotsLocalState | null;
  /** User id whose `presence` is currently authoritative. */
  presenceBy: string | null;
  createdAtMs: number;
}>;

/** Request body for creating a new room. */
export type CreateRoomRequest = Readonly<{
  name: string;
  ownerUserId: string;
  ownerName: string;
  config: DotsGameConfig;
  isPrivate: boolean;
  password?: string;
}>;

/** Request body for owner-side patches (config / password / kick). */
export type PatchRoomRequest = Readonly<{
  byUserId: string;
  config?: DotsGameConfig;
  isPrivate?: boolean;
  password?: string;
  kickUserId?: string;
}>;

/** Request body for joining a room (as player or viewer). */
export type JoinRoomRequest = Readonly<{
  userId: string;
  displayName: string;
  password?: string;
  asViewer?: boolean;
}>;

/** Request body for leaving a room. */
export type LeaveRoomRequest = Readonly<{
  userId: string;
}>;

/** Request body for transitioning a waiting room to `playing`. */
export type StartGameRequest = Readonly<{
  byUserId: string;
}>;

/** Envelope sent by an acting player to commit a server-side action. */
export type CommitActionRequest = Readonly<{
  userId: string;
  action: DotsServerAction;
  /** Hash the client believes is current on the server. */
  prevHash: string;
  /** Hash the client expects the server to produce after applying the action. */
  expectedNextHash: string;
}>;

/** Envelope sent by an acting player to broadcast ephemeral in-flight UI state. */
export type EphemeralActionRequest = Readonly<{
  userId: string;
  patch: DotsLocalState;
}>;

/** Discriminated failure for committed actions; clients use `snapshot` to resync. */
export type CommitRejectReason = "prevHash" | "badHash" | "notAuthorized" | "notInGame";

/** Successful or rejected response from `applyCommittedAction`. */
export type CommitActionResult =
  | Readonly<{ status: "ok" }>
  | Readonly<{ status: "rejected"; reason: CommitRejectReason; snapshot: DotsRoomDetail }>;

/** Live channel events broadcast to room subscribers. */
export type DotsRoomEvent =
  | Readonly<{ type: "ROOM_STATE"; room: DotsRoomDetail }>
  | Readonly<{ type: "STATE_DELTA"; room: DotsRoomDetail }>
  | Readonly<{ type: "PRESENCE_DELTA"; room: DotsRoomDetail }>;
