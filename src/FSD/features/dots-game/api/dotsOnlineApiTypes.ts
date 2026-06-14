import type { DotsLocalState } from "../model/localState";
import type { DotsServerAction } from "../model/serverReducer";
import type { DotsServerGameState, ReduceServerRejectReason } from "../model/serverState";
import type { PlayerId } from "../model/types";

/** Board dimensions persisted and transmitted by the server (no UI cell size). */
export type DotsBoardConfig = Readonly<{
  rows: number;
  cols: number;
}>;

/** Lifecycle status of a room exposed to clients. */
export type DotsRoomStatus = "waiting" | "playing" | "finished";

/** Slot the user occupies in the room (game-playing slots or spectator). */
export type DotsRoomSlot = PlayerId | "viewer";

/** Connected user as seen by other clients in a room. */
export type DotsOnlineUser = Readonly<{
  userId: string;
  displayName: string;
  isAi?: boolean;
}>;

/** Response from `POST /rooms/:roomId/ai`. */
export type AddAiResult = Readonly<{
  modelName: string;
  room: DotsRoomDetail;
}>;

/** Locked player user ids for an in-progress or finished game. */
export type DotsLockedPlayers = Readonly<{
  player0: string | null;
  player1: string | null;
}>;

/** Response from `POST /sessions/register`. */
export type RegisterSessionResult = Readonly<{
  userId: string;
  displayName: string;
  token: string;
}>;

/** Active in-progress game room returned by the session heartbeat. */
export type DotsSessionActiveRoom = Readonly<{
  id: string;
  status: DotsRoomStatus;
}>;

/** Response from `POST /sessions/heartbeat`. */
export type HeartbeatResult = Readonly<{
  activeRoom: DotsSessionActiveRoom | null;
}>;

/** Snapshot of a single room shown in the rooms list. */
export type DotsRoomSummary = Readonly<{
  id: string;
  name: string;
  ownerUserId: string;
  ownerName: string;
  isPrivate: boolean;
  hasPassword: boolean;
  config: DotsBoardConfig;
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
  config: DotsBoardConfig;
  /** Authoritative game state once the room has been started; `null` while waiting. */
  serverState: DotsServerGameState | null;
  /** Active player's in-flight UI state (broadcast verbatim; not part of the hash). */
  presence: DotsLocalState | null;
  /** User id whose `presence` is currently authoritative. */
  presenceBy: string | null;
  lockedPlayers: DotsLockedPlayers;
  connectedUserIds: readonly string[];
  createdAtMs: number;
}>;

/** Request body for creating a new room. */
export type CreateRoomRequest = Readonly<{
  name: string;
  ownerUserId: string;
  ownerName: string;
  config: DotsBoardConfig;
  isPrivate: boolean;
  password?: string;
}>;

/** Request body for owner-side patches (config / password / kick). */
export type PatchRoomRequest = Readonly<{
  byUserId: string;
  config?: DotsBoardConfig;
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
export type CommitRejectReason = "prevHash" | "badHash" | "notAuthorized" | "notInGame" | ReduceServerRejectReason;

/** Successful or rejected response from `applyCommittedAction`. */
export type CommitActionResult =
  | Readonly<{ status: "ok" }>
  | Readonly<{ status: "rejected"; reason: CommitRejectReason; snapshot: DotsRoomDetail }>;

/** Live channel events broadcast to room subscribers. */
export type DotsChatSenderKind = "ai" | "player" | "viewer";

export type DotsChatMessage = Readonly<{
  id: string;
  senderKind: DotsChatSenderKind;
  senderUserId: string | null;
  senderDisplayName: string | null;
  content: string;
  createdAtMs: number;
}>;

export type DotsChatReadState = Readonly<{
  userId: string;
  lastReadAtMs: number;
}>;

export type ListChatMessagesResult = Readonly<{
  messages: readonly DotsChatMessage[];
  hasMoreBefore: boolean;
  hasMoreAfter: boolean;
  readStates: readonly DotsChatReadState[];
}>;

export const MAX_CHAT_MESSAGE_LENGTH = 500;

export type DotsRoomEvent =
  | Readonly<{ type: "ROOM_STATE"; room: DotsRoomDetail }>
  | Readonly<{ type: "STATE_DELTA"; room: DotsRoomDetail }>
  | Readonly<{ type: "PRESENCE_DELTA"; room: DotsRoomDetail }>
  | Readonly<{ type: "CHAT_MESSAGE"; roomId: string; message: DotsChatMessage }>
  | Readonly<{ type: "CHAT_READ"; roomId: string; userId: string; lastReadAtMs: number }>
  | Readonly<{ type: "CHAT_TYPING"; roomId: string; userId: string; displayName: string }>;

/** Payload on the global dots API error document event. */
export type DotsApiErrorDetail = Readonly<{ message: string }>;

/** Result of `useSendGameAction` — committed and ephemeral action senders. */
export type UseSendGameActionResult = Readonly<{
  sendCommitted: (request: CommitActionRequest) => Promise<CommitActionResult>;
  sendEphemeral: (request: EphemeralActionRequest) => Promise<void>;
}>;

/** Result of `useRoomLive` — live room snapshot and connection state. */
export type UseRoomLiveResult = Readonly<{
  room: DotsRoomDetail | null;
  isConnected: boolean;
  /** Applies an authoritative room snapshot (e.g. after a rejected commit). */
  applyRoomSnapshot: (snapshot: DotsRoomDetail) => void;
}>;
