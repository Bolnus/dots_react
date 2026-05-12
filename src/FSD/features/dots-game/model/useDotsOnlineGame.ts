"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DotsRoomDetail } from "../api/dotsOnlineApiTypes";
import type { UseSendGameActionResult } from "../api/useSendGameAction";
import { INITIAL_LOCAL_STATE, isSameLocalState } from "./localState";
import type { DotsLocalState } from "./localState";
import { isChainClosed, reduceLocal } from "./localReducer";
import type { DotsLocalAction } from "./localReducer";
import { buildRenderState } from "./renderState";
import type { DotsRenderState } from "./renderState";
import { currentServerPlacingPlayer, reduceServer } from "./serverReducer";
import type { DotsServerGameState } from "./serverState";
import type { DotsGameState, GridPoint, PlayerId } from "./types";
import type { UseDotsGameResult } from "./useDotsGame";

export type DotsOnlineRole = "player" | "viewer";

export type UseDotsOnlineGameArgs = Readonly<{
  room: DotsRoomDetail;
  userId: string;
  send: UseSendGameActionResult;
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

/** Hook: drives an online dots game on top of authoritative server state + ephemeral presence. */
export function useDotsOnlineGame(args: UseDotsOnlineGameArgs): UseDotsOnlineGameResult {
  const { room, userId, send } = args;
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
        config: room.config,
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

  const sendEphemeralPatch = useCallback(
    (patch: DotsLocalState): void => {
      void send.sendEphemeral({ userId, patch });
    },
    [send, userId]
  );

  const commitPlacement = useCallback(
    (point: GridPoint, by: PlayerId, server: DotsServerGameState): void => {
      const predicted = reduceServer(server, { type: "COMMIT_PLACEMENT", point, by });
      if (predicted === server) {
        return;
      }
      void send
        .sendCommitted({
          userId,
          action: { type: "COMMIT_PLACEMENT", point, by },
          prevHash: server.hash,
          expectedNextHash: predicted.hash
        })
        .then(() => {
          setOwnLocal(INITIAL_LOCAL_STATE);
        });
    },
    [send, userId]
  );

  const commitCapture = useCallback(
    (ring: GridPoint[], by: PlayerId, server: DotsServerGameState): void => {
      const predicted = reduceServer(server, { type: "COMMIT_CAPTURE", ring, by });
      if (predicted === server) {
        return;
      }
      void send
        .sendCommitted({
          userId,
          action: { type: "COMMIT_CAPTURE", ring, by },
          prevHash: server.hash,
          expectedNextHash: predicted.hash
        })
        .then(() => {
          setOwnLocal(INITIAL_LOCAL_STATE);
        });
    },
    [send, userId]
  );

  const commitSurrender = useCallback(
    (by: PlayerId, server: DotsServerGameState): void => {
      const predicted = reduceServer(server, { type: "SURRENDER", by });
      if (predicted === server) {
        return;
      }
      void send.sendCommitted({
        userId,
        action: { type: "SURRENDER", by },
        prevHash: server.hash,
        expectedNextHash: predicted.hash
      });
    },
    [send, userId]
  );

  const applyLocalAction = useCallback(
    (action: DotsLocalAction): DotsLocalState | null => {
      if (!serverState || !isMyTurn) {
        return null;
      }
      const next = reduceLocal(ownLocal, action, serverState);
      if (isSameLocalState(next, ownLocal)) {
        return next;
      }
      setOwnLocal(next);
      sendEphemeralPatch(next);
      return next;
    },
    [serverState, isMyTurn, sendEphemeralPatch, ownLocal]
  );

  const placeLmb = useCallback(
    (point: GridPoint): void => {
      const next = applyLocalAction({ type: "PLACE_LMB", point });
      if (!next || !serverState || !slot) {
        return;
      }
      if (next.mode === "drawPolygon" && isChainClosed(next)) {
        commitCapture(next.chainPath, slot, serverState);
      }
    },
    [applyLocalAction, serverState, slot, commitCapture]
  );

  const polygonClick = useCallback(
    (point: GridPoint): void => {
      const next = applyLocalAction({ type: "POLYGON_CLICK", point });
      if (!next || !serverState || !slot) {
        return;
      }
      if (next.mode === "drawPolygon" && isChainClosed(next)) {
        commitCapture(next.chainPath, slot, serverState);
      }
    },
    [applyLocalAction, serverState, slot, commitCapture]
  );

  /** RMB is intentionally ignored to keep input platform-agnostic. */
  const placeRmb = useCallback((): void => {
    /* no-op */
  }, []);

  const accept = useCallback((): void => {
    if (!isMyTurn || !serverState || !slot) {
      return;
    }
    const pending = ownLocal.pendingDot;
    if (!pending || ownLocal.mode !== "play") {
      return;
    }
    commitPlacement(pending, slot, serverState);
  }, [isMyTurn, serverState, slot, commitPlacement, ownLocal]);

  const undo = useCallback((): void => {
    if (!isMyTurn) {
      return;
    }
    applyLocalAction({ type: "UNDO" });
  }, [isMyTurn, applyLocalAction]);

  const surrender = useCallback((): void => {
    if (!slot || !serverState || serverState.mode !== "play") {
      return;
    }
    commitSurrender(slot, serverState);
  }, [slot, serverState, commitSurrender]);

  const clear = useCallback((): void => {
    /* Clearing committed state is not allowed online; this is a no-op for parity with the hot-seat hook. */
  }, []);

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
    placeRmb,
    polygonClick,
    accept,
    undo,
    clear,
    surrender,
    currentPlayer,
    role,
    isMyTurn,
    viewerCount: room.viewers.length,
    playerLabels
  };
}
