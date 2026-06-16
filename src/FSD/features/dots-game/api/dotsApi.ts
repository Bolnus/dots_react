import type {
  AddAiResult,
  CommitActionRequest,
  CommitActionResult,
  CreateRoomRequest,
  DotsChatMessage,
  DotsRoomDetail,
  DotsRoomSummary,
  HeartbeatResult,
  JoinRoomRequest,
  ListChatMessagesResult,
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

/** Returns session info including any in-progress active game room. */
export async function fetchSession(options: Readonly<{ silentError?: boolean }> = {}): Promise<HeartbeatResult> {
  const { data } = await dotsHttp.post<HeartbeatResult>(
    "/sessions/heartbeat",
    undefined,
    withSilentDotsError(options.silentError === true)
  );
  return data;
}

/** Returns whether the stored bearer token is still valid. */
export async function validateSession(): Promise<boolean> {
  try {
    await fetchSession({ silentError: true });
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
export async function joinRoom(
  roomId: string,
  request: JoinRoomRequest,
  options: Readonly<{ silentError?: boolean }> = {}
): Promise<DotsRoomDetail> {
  const { data } = await dotsHttp.post<DotsRoomDetail>(
    `/rooms/${roomId}/join`,
    {
      password: request.password,
      asViewer: request.asViewer
    },
    withSilentDotsError(options.silentError === true)
  );
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

/** Adds an AI opponent to the second player slot. */
export async function addAiPlayer(roomId: string): Promise<AddAiResult> {
  const { data } = await dotsHttp.post<AddAiResult>(`/rooms/${roomId}/ai`);
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

type FetchChatMessagesArgs = Readonly<{
  afterMs?: number;
  beforeMs?: number;
  limit?: number;
}>;

/** Returns paginated chat messages for a room. */
export async function fetchChatMessages(
  roomId: string,
  args: FetchChatMessagesArgs = {}
): Promise<ListChatMessagesResult> {
  const { data } = await dotsHttp.get<ListChatMessagesResult>(`/rooms/${roomId}/chat/messages`, {
    params: {
      afterMs: args.afterMs,
      beforeMs: args.beforeMs,
      limit: args.limit
    }
  });
  return data;
}

/** Posts a chat message to a room. */
export async function postChatMessage(roomId: string, content: string): Promise<DotsChatMessage> {
  const { data } = await dotsHttp.post<DotsChatMessage>(`/rooms/${roomId}/chat/messages`, { content });
  return data;
}

/** Marks chat messages as read up to the given timestamp. */
export async function postChatRead(roomId: string, lastReadAtMs: number): Promise<void> {
  await dotsHttp.post(`/rooms/${roomId}/chat/read`, { lastReadAtMs });
}
