import type {
  CommitActionRequest,
  CommitActionResult,
  CreateRoomRequest,
  DotsRoomDetail,
  DotsRoomSummary,
  JoinRoomRequest,
  PatchRoomRequest,
  RegisterSessionResult
} from "./dotsOnlineApiTypes";
import { dotsHttp, withSilentDotsError } from "./dotsHttpClient";

type RegisterSessionOptions = Readonly<{
  silentError?: boolean;
}>;
/** Registers a display name and returns a session token. */
export async function registerSession(
  displayName: string,
  options: RegisterSessionOptions = {}
): Promise<RegisterSessionResult> {
  const { data } = await dotsHttp.post<RegisterSessionResult>(
    "/sessions/register",
    { displayName },
    withSilentDotsError(options.silentError === true)
  );
  return data;
}

/** Returns whether the stored bearer token is still valid. */
export async function validateSession(): Promise<boolean> {
  try {
    await dotsHttp.post("/sessions/heartbeat", undefined, withSilentDotsError(true));
    return true;
  } catch {
    return false;
  }
}

/** Returns all room summaries. */
export async function fetchRooms(): Promise<DotsRoomSummary[]> {
  const { data } = await dotsHttp.get<DotsRoomSummary[]>("/rooms");
  if (!Array.isArray(data)) {
    throw new Error("Invalid rooms list response");
  }
  return data;
}

/** Returns full detail for one room. */
export async function fetchRoom(roomId: string): Promise<DotsRoomDetail> {
  const { data } = await dotsHttp.get<DotsRoomDetail>(`/rooms/${roomId}`);
  return data;
}

/** Creates a new waiting room. */
export async function createRoom(request: CreateRoomRequest): Promise<DotsRoomDetail> {
  const { data } = await dotsHttp.post<DotsRoomDetail>("/rooms", {
    name: request.name,
    config: request.config,
    isPrivate: request.isPrivate,
    password: request.password
  });
  return data;
}

/** Patches room settings (owner, waiting only). */
export async function patchRoom(roomId: string, request: PatchRoomRequest): Promise<DotsRoomDetail> {
  const { data } = await dotsHttp.patch<DotsRoomDetail>(`/rooms/${roomId}`, {
    config: request.config,
    isPrivate: request.isPrivate,
    password: request.password,
    kickUserId: request.kickUserId
  });
  return data;
}

/** Joins a room as player or viewer. */
export async function joinRoom(roomId: string, request: JoinRoomRequest): Promise<DotsRoomDetail> {
  const { data } = await dotsHttp.post<DotsRoomDetail>(`/rooms/${roomId}/join`, {
    password: request.password,
    asViewer: request.asViewer
  });
  return data;
}

/** Leaves a room (owner deletes it). */
export async function leaveRoom(roomId: string): Promise<void> {
  await dotsHttp.post(`/rooms/${roomId}/leave`);
}

/** Starts the game when two players are present. */
export async function startGame(roomId: string): Promise<DotsRoomDetail> {
  const { data } = await dotsHttp.post<DotsRoomDetail>(`/rooms/${roomId}/start`);
  return data;
}

/** Applies a checksum-validated committed game action. */
export async function applyCommittedAction(roomId: string, request: CommitActionRequest): Promise<CommitActionResult> {
  const { data } = await dotsHttp.post<CommitActionResult>(`/rooms/${roomId}/actions/commit`, {
    action: request.action,
    prevHash: request.prevHash,
    expectedNextHash: request.expectedNextHash
  });
  return data;
}
