"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import type {
  CommitActionRequest,
  CommitActionResult,
  DotsRoomDetail,
  UseSendGameActionResult
} from "../api/dotsOnlineApiTypes";
import { INITIAL_LOCAL_STATE, isSameLocalState } from "./localState";
import type { DotsLocalState } from "./localState";
import { isChainClosed, reduceLocal } from "./localReducer";
import type { DotsLocalAction } from "./localReducer";
import { buildRenderState } from "./renderState";
import type { DotsRenderState } from "./renderState";
import { currentServerPlacingPlayer, reduceServer } from "./serverReducer";
import type { DotsServerGameState } from "./serverState";
import { toClientGameConfig } from "./boardConfig";
import type { DotsGameState, GridPoint, PlayerId } from "./types";
import type { UseDotsGameResult } from "./useDotsGame";

export type DotsOnlineRole = "player" | "viewer";

export type CommitRejectedResult = Extract<CommitActionResult, { status: "rejected" }>;

export type UseDotsOnlineGameArgs = Readonly<{
  room: DotsRoomDetail;
  userId: string;
  send: UseSendGameActionResult;
  onCommitRejected: (result: CommitRejectedResult) => void;
}>;

export type UseDotsOnlineGameResult = Readonly<
  UseDotsGameResult & {
    role: DotsOnlineRole;
    isMyTurn: boolean;
    viewerCount: number;
    playerLabels: Readonly<Record<PlayerId, string>>;
  }
>;

/** Locates the player slot for `userId` in the room (or `null` if a viewer / absent). */
function findPlayerSlot(room: DotsRoomDetail, userId: string): PlayerId | null {
  if (room.lockedPlayers.player0 === userId) {
    return "player0";
  }
  if (room.lockedPlayers.player1 === userId) {
    return "player1";
  }
  return room.players.find((player) => player.user.userId === userId)?.slot ?? null;
}

/** Player labels in the dots scoreboard (player0 → first, player1 → second). */
function buildPlayerLabels(room: DotsRoomDetail): Readonly<Record<PlayerId, string>> {
  const player0 = room.players.find((player) => player.slot === "player0")?.user.displayName ?? "Player 1";
  const player1 = room.players.find((player) => player.slot === "player1")?.user.displayName ?? "Player 2";
  return { player0, player1 };
}

/** Picks the local state to render for this client: own state when acting, room.presence otherwise. */
function pickRenderLocal(isActing: boolean, ownLocal: DotsLocalState, presence: DotsLocalState | null): DotsLocalState {
  if (isActing) {
    return ownLocal;
  }
  return presence ?? INITIAL_LOCAL_STATE;
}

type OnlineCommitContext = Readonly<{
  send: UseSendGameActionResult;
  userId: string;
  onCommitRejected: (result: CommitRejectedResult) => void;
  setOwnLocal: Dispatch<SetStateAction<DotsLocalState>>;
}>;

type ApplyLocalContext = Readonly<{
  serverState: DotsServerGameState | null | undefined;
  isMyTurn: boolean;
  ownLocal: DotsLocalState;
  send: UseSendGameActionResult;
  userId: string;
  setOwnLocal: Dispatch<SetStateAction<DotsLocalState>>;
}>;

/** Sends a committed action and applies the HTTP result (HTTP failures use the global API modal). */
async function submitCommit(ctx: OnlineCommitContext, request: CommitActionRequest): Promise<void> {
  try {
    const result = await ctx.send.sendCommitted(request);
    if (result.status === "ok") {
      ctx.setOwnLocal(INITIAL_LOCAL_STATE);
      return;
    }
    ctx.onCommitRejected(result);
  } catch {
    /* HTTP errors surface via the axios interceptor */
  }
}

/** Commits a dot placement to the server. */
function performCommitPlacement(
  ctx: OnlineCommitContext,
  point: GridPoint,
  by: PlayerId,
  server: DotsServerGameState
): void {
  const predicted = reduceServer(server, { type: "COMMIT_PLACEMENT", point, by });
  if (predicted === server) {
    return;
  }
  void submitCommit(ctx, {
    userId: ctx.userId,
    action: { type: "COMMIT_PLACEMENT", point, by },
    prevHash: server.hash,
    expectedNextHash: predicted.hash
  });
}

/** Commits a polygon capture to the server. */
function performCommitCapture(
  ctx: OnlineCommitContext,
  ring: GridPoint[],
  by: PlayerId,
  server: DotsServerGameState
): void {
  const predicted = reduceServer(server, { type: "COMMIT_CAPTURE", ring, by });
  if (predicted === server) {
    return;
  }
  void submitCommit(ctx, {
    userId: ctx.userId,
    action: { type: "COMMIT_CAPTURE", ring, by },
    prevHash: server.hash,
    expectedNextHash: predicted.hash
  });
}

/** Commits surrender to the server. */
function performCommitSurrender(ctx: OnlineCommitContext, by: PlayerId, server: DotsServerGameState): void {
  const predicted = reduceServer(server, { type: "SURRENDER", by });
  if (predicted === server) {
    return;
  }
  void submitCommit(ctx, {
    userId: ctx.userId,
    action: { type: "SURRENDER", by },
    prevHash: server.hash,
    expectedNextHash: predicted.hash
  });
}

/** Applies a local UI action and broadcasts ephemeral presence when it changes state. */
function performApplyLocalAction(ctx: ApplyLocalContext, action: DotsLocalAction): DotsLocalState | null {
  if (!ctx.serverState || !ctx.isMyTurn) {
    return null;
  }
  const next = reduceLocal(ctx.ownLocal, action, ctx.serverState);
  if (isSameLocalState(next, ctx.ownLocal)) {
    return next;
  }
  ctx.setOwnLocal(next);
  void ctx.send.sendEphemeral({ userId: ctx.userId, patch: next });
  return next;
}

/** Hook: drives an online dots game on top of authoritative server state + ephemeral presence. */
export function useDotsOnlineGame(args: UseDotsOnlineGameArgs): UseDotsOnlineGameResult {
  const { room, userId, send, onCommitRejected } = args;
  const slot = findPlayerSlot(room, userId);
  const role: DotsOnlineRole = slot === null ? "viewer" : "player";

  const { serverState } = room;
  const acting = serverState && serverState.mode === "play" ? currentServerPlacingPlayer(serverState) : null;
  const isMyTurn = role === "player" && acting !== null && acting === slot;

  const [ownLocal, setOwnLocal] = useState<DotsLocalState>(INITIAL_LOCAL_STATE);

  useEffect(() => {
    if (!isMyTurn && ownLocal !== INITIAL_LOCAL_STATE) {
      setOwnLocal(INITIAL_LOCAL_STATE);
    }
  }, [isMyTurn, ownLocal]);

  const renderLocal = pickRenderLocal(isMyTurn, ownLocal, room.presence);

  const renderState: DotsRenderState = useMemo(() => {
    if (!serverState) {
      return {
        config: toClientGameConfig(room.config),
        cells: [],
        scores: { player0: 0, player1: 0 },
        mode: "play",
        pendingDot: null,
        chainStart: null,
        chainPath: [],
        polygons: [],
        winner: null,
        surrenderedBy: null
      };
    }
    return buildRenderState(serverState, renderLocal);
  }, [serverState, renderLocal, room.config]);

  const playerLabels = useMemo(() => buildPlayerLabels(room), [room]);

  const placeLmb = useCallback(
    (point: GridPoint): void => {
      if (!isMyTurn || !serverState || !slot) {
        return;
      }
      const commitCtx: OnlineCommitContext = { send, userId, onCommitRejected, setOwnLocal };
      const applyLocalCtx: ApplyLocalContext = { serverState, isMyTurn, ownLocal, send, userId, setOwnLocal };
      const pending = ownLocal.pendingDot;
      if (ownLocal.mode === "play" && pending !== null && pending.r === point.r && pending.c === point.c) {
        performCommitPlacement(commitCtx, pending, slot, serverState);
        return;
      }
      const next = performApplyLocalAction(applyLocalCtx, { type: "PLACE_LMB", point });
      if (!next) {
        return;
      }
      if (next.mode === "drawPolygon" && isChainClosed(next)) {
        performCommitCapture(commitCtx, next.chainPath, slot, serverState);
      }
    },
    [isMyTurn, serverState, slot, ownLocal, send, userId, onCommitRejected]
  );

  const polygonClick = useCallback(
    (point: GridPoint): void => {
      const next = performApplyLocalAction(
        { serverState, isMyTurn, ownLocal, send, userId, setOwnLocal },
        { type: "POLYGON_CLICK", point }
      );
      if (!next || !serverState || !slot) {
        return;
      }
      if (next.mode === "drawPolygon" && isChainClosed(next)) {
        performCommitCapture({ send, userId, onCommitRejected, setOwnLocal }, next.chainPath, slot, serverState);
      }
    },
    [isMyTurn, ownLocal, serverState, slot, send, userId, onCommitRejected]
  );

  const accept = useCallback((): void => {
    if (!isMyTurn || !serverState || !slot) {
      return;
    }
    const pending = ownLocal.pendingDot;
    if (!pending || ownLocal.mode !== "play") {
      return;
    }
    performCommitPlacement({ send, userId, onCommitRejected, setOwnLocal }, pending, slot, serverState);
  }, [isMyTurn, serverState, slot, ownLocal, send, userId, onCommitRejected]);

  const undo = useCallback((): void => {
    if (!isMyTurn) {
      return;
    }
    performApplyLocalAction({ serverState, isMyTurn, ownLocal, send, userId, setOwnLocal }, { type: "UNDO" });
  }, [isMyTurn, serverState, ownLocal, send, userId]);

  const surrender = useCallback((): void => {
    if (!slot || !serverState || serverState.mode !== "play") {
      return;
    }
    performCommitSurrender({ send, userId, onCommitRejected, setOwnLocal }, slot, serverState);
  }, [slot, serverState, send, userId, onCommitRejected]);

  const currentPlayer: PlayerId = serverState ? currentServerPlacingPlayer(serverState) : "player0";

  const renderShim: DotsGameState = useMemo(
    () => ({
      config: renderState.config,
      cells: renderState.cells,
      dotsPlacedCount: serverState?.dotsPlacedCount ?? 0,
      pendingDot: renderState.pendingDot,
      scores: renderState.scores,
      mode: renderState.mode,
      winner: renderState.winner,
      surrenderedBy: renderState.surrenderedBy,
      chainStart: renderState.chainStart,
      chainPath: renderState.chainPath,
      polygons: renderState.polygons,
      undoStack: []
    }),
    [renderState, serverState]
  );

  return {
    state: renderShim,
    placeLmb,
    polygonClick,
    accept,
    undo,
    surrender,
    currentPlayer,
    role,
    isMyTurn,
    viewerCount: room.viewers.length,
    playerLabels
  };
}
