"use client";

import { useCallback, useReducer } from "react";

import { currentPlacingPlayer, initialDotsGameState, reduceDotsGame } from "./dotsGameReducer";
import type { DotsGameState, GridPoint, PlayerId } from "./types";

export type UseDotsGameResult = Readonly<{
  state: DotsGameState;
  placeLmb: (point: GridPoint) => void;
  placeRmb: (point: GridPoint) => void;
  polygonClick: (point: GridPoint) => void;
  accept: () => void;
  undo: () => void;
  clear: () => void;
  surrender: () => void;
  currentPlayer: PlayerId;
}>;

/** Client hook: exposes dots-game state and UI actions. */
export function useDotsGame(): UseDotsGameResult {
  const [state, dispatch] = useReducer(reduceDotsGame, undefined, initialDotsGameState);

  const placeLmb = useCallback((point: GridPoint) => {
    dispatch({ type: "PLACE_LMB", point });
  }, []);

  const placeRmb = useCallback((point: GridPoint) => {
    dispatch({ type: "PLACE_RMB", point });
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
    placeRmb,
    polygonClick,
    accept,
    undo,
    clear,
    surrender,
    currentPlayer: currentPlacingPlayer(state.dotsPlacedCount)
  };
}
