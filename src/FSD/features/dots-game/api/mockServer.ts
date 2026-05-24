import type {
  CommitActionRequest,
  CommitActionResult,
  CreateRoomRequest,
  DotsOnlineUser,
  DotsRoomDetail,
  DotsRoomEvent,
  DotsRoomStatus,
  DotsRoomSummary,
  EphemeralActionRequest,
  JoinRoomRequest,
  LeaveRoomRequest,
  PatchRoomRequest,
  StartGameRequest
} from "./dotsOnlineApiTypes";
import type { DotsLocalState } from "../model/localState";
import { currentServerPlacingPlayer, reduceServer } from "../model/serverReducer";
import { initialServerStateFromConfig } from "../model/serverState";
import type { DotsServerGameState } from "../model/serverState";
import { toClientGameConfig } from "../model/boardConfig";
import type { DotsBoardConfig } from "./dotsOnlineApiTypes";
import type { DotsGameConfig, GridPoint, PlayerId } from "../model/types";

/** Strips UI-only fields from a mock room config for wire types. */
function toWireBoardConfig(config: DotsGameConfig): DotsBoardConfig {
  return { rows: config.rows, cols: config.cols };
}

/** Simulated latency for REST mock calls (ms). */
const REST_LATENCY_MS = 80;
/** Simulated latency for realtime broadcasts (ms). */
const REALTIME_LATENCY_MS = 25;
/** Maximum number of players a dots room accepts (the second slot is the opponent). */
const MAX_PLAYERS = 2;
/** Delay before a bot opponent joins a freshly-created user-owned waiting room. */
const BOT_JOIN_DELAY_MS = 1500;
/** Delay between a bot's turn becoming active and the bot actually moving. */
const BOT_MOVE_DELAY_MS = 850;
/** Display names rotated for bot opponents in solo demos. */
const BOT_DISPLAY_NAMES = ["Botty", "Pixel", "Echo", "Glitch", "Nova"] as const;

type RoomRecord = {
  id: string;
  name: string;
  ownerUserId: string;
  isPrivate: boolean;
  password: string | null;
  status: DotsRoomStatus;
  players: { slot: PlayerId; user: DotsOnlineUser }[];
  viewers: DotsOnlineUser[];
  config: DotsGameConfig;
  serverState: DotsServerGameState | null;
  presence: DotsLocalState | null;
  presenceBy: string | null;
  createdAtMs: number;
};

type RoomSubscriber = (event: DotsRoomEvent) => void;

const rooms = new Map<string, RoomRecord>();
const subscribers = new Map<string, Set<RoomSubscriber>>();
const botUserIds = new Set<string>();
let nextRoomNumericId = 1;
let nextUserNumericId = 1;
let nextBotNameIndex = 0;
let didSeed = false;

/** Sleeps for `ms` to simulate network latency on the mocked transport. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Generates a stable room id with a stable prefix. */
function generateRoomId(): string {
  const numericId = nextRoomNumericId;
  nextRoomNumericId += 1;
  return `room-${numericId.toString().padStart(4, "0")}`;
}

/** Generates a stable synthetic user id (used for seeded demo bots). */
function generateBotUserId(): string {
  const numericId = nextUserNumericId;
  nextUserNumericId += 1;
  return `bot-${numericId.toString().padStart(4, "0")}`;
}

/** Returns the readonly room detail view for transport over the wire. */
function toRoomDetail(room: RoomRecord): DotsRoomDetail {
  return {
    id: room.id,
    name: room.name,
    ownerUserId: room.ownerUserId,
    isPrivate: room.isPrivate,
    hasPassword: room.password !== null,
    status: room.status,
    players: room.players.map((player) => ({ slot: player.slot, user: { ...player.user } })),
    viewers: room.viewers.map((user) => ({ ...user })),
    config: toWireBoardConfig(room.config),
    serverState: room.serverState,
    presence: room.presence,
    presenceBy: room.presenceBy,
    lockedPlayers: {
      player0: room.players.find((player) => player.slot === "player0")?.user.userId ?? null,
      player1: room.players.find((player) => player.slot === "player1")?.user.userId ?? null
    },
    connectedUserIds: [],
    createdAtMs: room.createdAtMs
  };
}

/** Returns the lightweight summary used by the rooms list. */
function toRoomSummary(room: RoomRecord): DotsRoomSummary {
  return {
    id: room.id,
    name: room.name,
    ownerUserId: room.ownerUserId,
    ownerName: room.players.find((player) => player.user.userId === room.ownerUserId)?.user.displayName ?? "—",
    isPrivate: room.isPrivate,
    hasPassword: room.password !== null,
    config: toWireBoardConfig(room.config),
    status: room.status,
    playerCount: room.players.length,
    maxPlayers: MAX_PLAYERS,
    viewerCount: room.viewers.length,
    createdAtMs: room.createdAtMs
  };
}

/** Schedules a broadcast on the room's pub/sub channel after the simulated realtime delay. */
function broadcastRoomEvent(roomId: string, event: DotsRoomEvent): void {
  const channel = subscribers.get(roomId);
  if (!channel || channel.size === 0) {
    return;
  }
  const recipients = Array.from(channel);
  setTimeout(() => {
    for (const recipient of recipients) {
      recipient(event);
    }
  }, REALTIME_LATENCY_MS);
}

/** True when the user is the room owner. */
function isOwner(room: RoomRecord, userId: string): boolean {
  return room.ownerUserId === userId;
}

/** Locates the first empty player slot in the room, or `null` if both are taken. */
function nextFreePlayerSlot(room: RoomRecord): PlayerId | null {
  const taken = new Set(room.players.map((player) => player.slot));
  if (!taken.has("player0")) {
    return "player0";
  }
  if (!taken.has("player1")) {
    return "player1";
  }
  return null;
}

/** Inserts a seeded demo room (used once on first access for an interesting initial list). */
function pushSeedRoom(
  args: Readonly<{
    name: string;
    ownerName: string;
    config: DotsGameConfig;
    isPrivate: boolean;
    password: string | null;
    status: DotsRoomStatus;
    secondPlayerName: string | null;
    viewerNames: readonly string[];
  }>
): void {
  const ownerUserId = generateBotUserId();
  const room: RoomRecord = {
    id: generateRoomId(),
    name: args.name,
    ownerUserId,
    isPrivate: args.isPrivate,
    password: args.password,
    status: args.status,
    players: [{ slot: "player0", user: { userId: ownerUserId, displayName: args.ownerName } }],
    viewers: args.viewerNames.map((displayName) => ({ userId: generateBotUserId(), displayName })),
    config: args.config,
    serverState: args.status === "waiting" ? null : initialServerStateFromConfig(args.config),
    presence: null,
    presenceBy: null,
    createdAtMs: Date.now()
  };
  if (args.secondPlayerName !== null) {
    room.players.push({
      slot: "player1",
      user: { userId: generateBotUserId(), displayName: args.secondPlayerName }
    });
  }
  if (args.status === "finished" && room.serverState) {
    room.serverState = { ...room.serverState, mode: "ended", winner: "player0", surrenderedBy: "player1" };
  }
  rooms.set(room.id, room);
}

/** Idempotently inserts a small fixed catalog of demo rooms. */
function seedDemoRoomsIfNeeded(): void {
  if (didSeed) {
    return;
  }
  didSeed = true;
  pushSeedRoom({
    name: "Friendly grid",
    ownerName: "Demo host",
    config: { rows: 16, cols: 12, cellSizePx: 30 },
    isPrivate: false,
    password: null,
    status: "waiting",
    secondPlayerName: null,
    viewerNames: []
  });
  pushSeedRoom({
    name: "Pro arena",
    ownerName: "Polly",
    config: { rows: 28, cols: 20, cellSizePx: 30 },
    isPrivate: false,
    password: null,
    status: "playing",
    secondPlayerName: "Kasper",
    viewerNames: ["Anna", "Mike"]
  });
  pushSeedRoom({
    name: "Private duel",
    ownerName: "Iris",
    config: { rows: 20, cols: 14, cellSizePx: 30 },
    isPrivate: true,
    password: "1234",
    status: "waiting",
    secondPlayerName: null,
    viewerNames: []
  });
}

/** Returns the next round-robin bot display name (prefixed with an emoji for visibility). */
function nextBotDisplayName(): string {
  const name = BOT_DISPLAY_NAMES[nextBotNameIndex % BOT_DISPLAY_NAMES.length];
  nextBotNameIndex += 1;
  return `🤖 ${name}`;
}

/** Returns a uniform integer in `[0, maxExclusive)` using `crypto.getRandomValues` when available. */
function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) {
    return 0;
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % maxExclusive;
  }
  // eslint-disable-next-line sonarjs/pseudo-random
  return Math.floor(Math.random() * maxExclusive);
}

/** Picks a random unowned, unblocked cell for the bot to claim (or `null` when the board is saturated). */
function pickRandomEmptyCell(state: DotsServerGameState): GridPoint | null {
  const candidates: GridPoint[] = [];
  for (let rowIndex = 0; rowIndex < state.cells.length; rowIndex++) {
    const row = state.cells[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cell = row[colIndex];
      if (cell.owner === null && !cell.blocked) {
        candidates.push({ r: rowIndex, c: colIndex });
      }
    }
  }
  if (candidates.length === 0) {
    return null;
  }
  return candidates[randomInt(candidates.length)];
}

/** Schedules a bot opponent to join the room after a short delay, only when a slot is free. */
function scheduleBotJoinIfNeeded(roomId: string): void {
  setTimeout(() => {
    const room = rooms.get(roomId);
    if (!room || room.status !== "waiting" || room.players.length >= MAX_PLAYERS) {
      return;
    }
    const botUserId = generateBotUserId();
    botUserIds.add(botUserId);
    room.players.push({
      slot: "player1",
      user: { userId: botUserId, displayName: nextBotDisplayName() }
    });
    broadcastRoomEvent(roomId, { type: "STATE_DELTA", room: toRoomDetail(room) });
  }, BOT_JOIN_DELAY_MS);
}

/** Performs the bot's move synchronously when invoked; broadcasts the resulting state. */
function runBotMove(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room || !room.serverState || room.serverState.mode !== "play") {
    return;
  }
  const acting = currentServerPlacingPlayer(room.serverState);
  const actingPlayer = room.players.find((player) => player.slot === acting);
  if (!actingPlayer || !botUserIds.has(actingPlayer.user.userId)) {
    return;
  }
  const move = pickRandomEmptyCell(room.serverState);
  if (!move) {
    const surrendered = reduceServer(room.serverState, { type: "SURRENDER", by: acting });
    if (surrendered === room.serverState) {
      return;
    }
    room.serverState = surrendered;
    if (surrendered.mode === "ended") {
      room.status = "finished";
    }
    broadcastRoomEvent(roomId, { type: "STATE_DELTA", room: toRoomDetail(room) });
    return;
  }
  const placed = reduceServer(room.serverState, { type: "COMMIT_PLACEMENT", point: move, by: acting });
  if (placed === room.serverState) {
    return;
  }
  room.serverState = placed;
  room.presence = null;
  room.presenceBy = null;
  if (placed.mode === "ended") {
    room.status = "finished";
  }
  broadcastRoomEvent(roomId, { type: "STATE_DELTA", room: toRoomDetail(room) });
}

/** If the active player is a bot, schedules its move after a short "thinking" delay. */
function scheduleBotMoveIfBotTurn(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room || !room.serverState || room.serverState.mode !== "play") {
    return;
  }
  const acting = currentServerPlacingPlayer(room.serverState);
  const actingPlayer = room.players.find((player) => player.slot === acting);
  if (!actingPlayer || !botUserIds.has(actingPlayer.user.userId)) {
    return;
  }
  setTimeout(() => runBotMove(roomId), BOT_MOVE_DELAY_MS);
}

/** Returns a snapshot of all rooms (lightweight summary view). */
export async function fetchRooms(): Promise<DotsRoomSummary[]> {
  seedDemoRoomsIfNeeded();
  await delay(REST_LATENCY_MS);
  return Array.from(rooms.values()).map((room) => toRoomSummary(room));
}

/** Returns the full detail for one room (404 simulated via a rejected promise). */
export async function fetchRoom(roomId: string): Promise<DotsRoomDetail> {
  seedDemoRoomsIfNeeded();
  await delay(REST_LATENCY_MS);
  const room = rooms.get(roomId);
  if (!room) {
    throw new Error(`Room not found: ${roomId}`);
  }
  return toRoomDetail(room);
}

/** Creates a brand new room, with the caller as owner and `player0`. */
export async function createRoom(request: CreateRoomRequest): Promise<DotsRoomDetail> {
  seedDemoRoomsIfNeeded();
  await delay(REST_LATENCY_MS);
  const id = generateRoomId();
  const room: RoomRecord = {
    id,
    name: request.name.trim() || `Room ${id}`,
    ownerUserId: request.ownerUserId,
    isPrivate: request.isPrivate,
    password: request.password ?? null,
    status: "waiting",
    players: [
      {
        slot: "player0",
        user: { userId: request.ownerUserId, displayName: request.ownerName }
      }
    ],
    viewers: [],
    config: toClientGameConfig(request.config),
    serverState: null,
    presence: null,
    presenceBy: null,
    createdAtMs: Date.now()
  };
  rooms.set(id, room);
  broadcastRoomEvent(id, { type: "ROOM_STATE", room: toRoomDetail(room) });
  scheduleBotJoinIfNeeded(id);
  return toRoomDetail(room);
}

/** Mutates the room when called by its owner (config / privacy / password / kick). */
export async function patchRoom(roomId: string, request: PatchRoomRequest): Promise<DotsRoomDetail> {
  await delay(REST_LATENCY_MS);
  const room = rooms.get(roomId);
  if (!room) {
    throw new Error(`Room not found: ${roomId}`);
  }
  if (!isOwner(room, request.byUserId)) {
    throw new Error("Only the room owner can change settings");
  }
  if (room.status !== "waiting") {
    throw new Error("Settings are locked once the game has started");
  }
  if (request.config !== undefined) {
    room.config = toClientGameConfig(request.config);
  }
  if (request.isPrivate !== undefined) {
    room.isPrivate = request.isPrivate;
  }
  if (request.password !== undefined) {
    room.password = request.password === "" ? null : request.password;
  }
  if (request.kickUserId !== undefined && request.kickUserId !== room.ownerUserId) {
    room.players = room.players.filter((player) => player.user.userId !== request.kickUserId);
    room.viewers = room.viewers.filter((viewer) => viewer.userId !== request.kickUserId);
  }
  broadcastRoomEvent(roomId, { type: "STATE_DELTA", room: toRoomDetail(room) });
  return toRoomDetail(room);
}

/** Adds the user to a room, either as a player (when a slot is free) or as a viewer. */
export async function joinRoom(roomId: string, request: JoinRoomRequest): Promise<DotsRoomDetail> {
  await delay(REST_LATENCY_MS);
  const room = rooms.get(roomId);
  if (!room) {
    throw new Error(`Room not found: ${roomId}`);
  }
  if (room.password !== null && room.password !== request.password) {
    throw new Error("Wrong password");
  }
  const alreadyPlayer = room.players.some((player) => player.user.userId === request.userId);
  const alreadyViewer = room.viewers.some((viewer) => viewer.userId === request.userId);
  if (!alreadyPlayer && !alreadyViewer) {
    const wantsViewer = request.asViewer === true || room.status !== "waiting";
    const freeSlot = wantsViewer ? null : nextFreePlayerSlot(room);
    if (freeSlot) {
      room.players.push({
        slot: freeSlot,
        user: { userId: request.userId, displayName: request.displayName }
      });
    } else {
      room.viewers.push({ userId: request.userId, displayName: request.displayName });
    }
  }
  broadcastRoomEvent(roomId, { type: "STATE_DELTA", room: toRoomDetail(room) });
  return toRoomDetail(room);
}

/** Removes the user from the room; when the owner leaves, the room is destroyed. */
export async function leaveRoom(roomId: string, request: LeaveRoomRequest): Promise<void> {
  await delay(REST_LATENCY_MS);
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }
  if (room.ownerUserId === request.userId) {
    rooms.delete(roomId);
    broadcastRoomEvent(roomId, { type: "STATE_DELTA", room: toRoomDetail({ ...room, status: "finished" }) });
    subscribers.delete(roomId);
    return;
  }
  room.players = room.players.filter((player) => player.user.userId !== request.userId);
  room.viewers = room.viewers.filter((viewer) => viewer.userId !== request.userId);
  broadcastRoomEvent(roomId, { type: "STATE_DELTA", room: toRoomDetail(room) });
}

/** Transitions a `waiting` room to `playing` and seeds its authoritative state. */
export async function startGame(roomId: string, request: StartGameRequest): Promise<DotsRoomDetail> {
  await delay(REST_LATENCY_MS);
  const room = rooms.get(roomId);
  if (!room) {
    throw new Error(`Room not found: ${roomId}`);
  }
  if (!isOwner(room, request.byUserId)) {
    throw new Error("Only the room owner can start the game");
  }
  if (room.players.length < MAX_PLAYERS) {
    throw new Error("Need 2 players to start");
  }
  room.status = "playing";
  room.serverState = initialServerStateFromConfig({ rows: room.config.rows, cols: room.config.cols });
  room.presence = null;
  room.presenceBy = null;
  broadcastRoomEvent(roomId, { type: "STATE_DELTA", room: toRoomDetail(room) });
  scheduleBotMoveIfBotTurn(roomId);
  return toRoomDetail(room);
}

/** Resolves the player slot for `userId` in the room, or `null` when not a player. */
function findPlayerSlot(room: RoomRecord, userId: string): PlayerId | null {
  return room.players.find((player) => player.user.userId === userId)?.slot ?? null;
}

/** Determines whether `userId` is the player whose turn it currently is. */
function isActingPlayer(room: RoomRecord, userId: string): boolean {
  if (!room.serverState || room.serverState.mode !== "play") {
    return false;
  }
  const slot = findPlayerSlot(room, userId);
  if (!slot) {
    return false;
  }
  const acting = room.serverState.dotsPlacedCount % 2 === 0 ? "player0" : "player1";
  return slot === acting;
}

/** True when the user is an active player in a playing room. */
function isLockedPlayer(room: RoomRecord, userId: string): boolean {
  if (room.status !== "playing") {
    return false;
  }
  return findPlayerSlot(room, userId) !== null;
}

/** True when the user may commit the given action (turn-gated except for surrender). */
function canCommitAction(room: RoomRecord, userId: string, action: CommitActionRequest["action"]): boolean {
  if (!isLockedPlayer(room, userId)) {
    return false;
  }
  if (action.type === "SURRENDER") {
    const slot = findPlayerSlot(room, userId);
    return slot !== null && action.by === slot;
  }
  return isActingPlayer(room, userId);
}

/** Applies a checksum-validated committed action; broadcasts the new state on success. */
export async function applyCommittedAction(roomId: string, request: CommitActionRequest): Promise<CommitActionResult> {
  await delay(REALTIME_LATENCY_MS);
  const room = rooms.get(roomId);
  if (!room || room.status !== "playing" || !room.serverState) {
    if (room) {
      return { status: "rejected", reason: "notInGame", snapshot: toRoomDetail(room) };
    }
    throw new Error(`Room not found: ${roomId}`);
  }
  if (!canCommitAction(room, request.userId, request.action)) {
    return { status: "rejected", reason: "notAuthorized", snapshot: toRoomDetail(room) };
  }
  if (request.prevHash !== room.serverState.hash) {
    return { status: "rejected", reason: "prevHash", snapshot: toRoomDetail(room) };
  }
  const nextState = reduceServer(room.serverState, request.action);
  if (nextState === room.serverState) {
    return { status: "rejected", reason: "notAuthorized", snapshot: toRoomDetail(room) };
  }
  if (nextState.hash !== request.expectedNextHash) {
    return { status: "rejected", reason: "badHash", snapshot: toRoomDetail(room) };
  }
  room.serverState = nextState;
  room.presence = null;
  room.presenceBy = null;
  if (nextState.mode === "ended") {
    room.status = "finished";
  }
  broadcastRoomEvent(roomId, { type: "STATE_DELTA", room: toRoomDetail(room) });
  scheduleBotMoveIfBotTurn(roomId);
  return { status: "ok" };
}

/** Stores the active player's ephemeral UI patch and broadcasts it (no checksum, no version). */
export async function applyEphemeralAction(roomId: string, request: EphemeralActionRequest): Promise<void> {
  await delay(REALTIME_LATENCY_MS);
  const room = rooms.get(roomId);
  if (!room || !room.serverState) {
    return;
  }
  if (!isActingPlayer(room, request.userId)) {
    return;
  }
  room.presence = request.patch;
  room.presenceBy = request.userId;
  broadcastRoomEvent(roomId, { type: "PRESENCE_DELTA", room: toRoomDetail(room) });
}

/** Subscribes to live events for a room and emits a `ROOM_STATE` immediately (or null when missing). */
export function subscribeRoom(roomId: string, listener: RoomSubscriber): () => void {
  seedDemoRoomsIfNeeded();
  let channel = subscribers.get(roomId);
  if (!channel) {
    channel = new Set();
    subscribers.set(roomId, channel);
  }
  channel.add(listener);
  const room = rooms.get(roomId);
  if (room) {
    setTimeout(() => listener({ type: "ROOM_STATE", room: toRoomDetail(room) }), 0);
  }
  return () => {
    channel?.delete(listener);
    if (channel && channel.size === 0) {
      subscribers.delete(roomId);
    }
  };
}
