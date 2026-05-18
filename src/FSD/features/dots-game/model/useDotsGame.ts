"use client";

import { useCallback, useReducer } from "react";

import { currentPlacingPlayer, initialDotsGameStateFromConfig, reduceDotsGame } from "./dotsGameReducer";
import type { DotsGameConfig, DotsGameState, GridPoint, PlayerId } from "./types";

export type UseDotsGameResult = Readonly<{
  state: DotsGameState;
  placeLmb: (point: GridPoint) => void;
  polygonClick: (point: GridPoint) => void;
  accept: () => void;
  undo: () => void;
  /** When omitted, the Clear toolbar button is hidden (e.g. online play). */
  clear?: () => void;
  surrender: () => void;
  currentPlayer: PlayerId;
}>;

/** Client hook: exposes dots-game state and UI actions. */
export function useDotsGame(initialConfig: DotsGameConfig): UseDotsGameResult {
  const [state, dispatch] = useReducer(reduceDotsGame, initialConfig, initialDotsGameStateFromConfig);

  const placeLmb = useCallback((point: GridPoint) => {
    dispatch({ type: "PLACE_LMB", point });
  }, []);

  const polygonClick = useCallback((point: GridPoint) => {
    dispatch({ type: "POLYGON_CLICK", point });
  }, []);

  const accept = useCallback(() => {
    dispatch({ type: "ACCEPT" });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const surrender = useCallback(() => {
    dispatch({ type: "SURRENDER" });
  }, []);

  return {
    state,
    placeLmb,
    polygonClick,
    accept,
    undo,
    clear,
    surrender,
    currentPlayer: currentPlacingPlayer(state.dotsPlacedCount)
  };
}
