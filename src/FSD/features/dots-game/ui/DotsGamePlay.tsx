"use client";

import type { ReactElement } from "react";

import { useDotsGame } from "../model/useDotsGame";
import type { DotsGameConfig, PlayerId } from "../model/types";

import { DotsBoardView } from "./DotsBoardView";

export type DotsGamePlayProps = Readonly<{
  config: DotsGameConfig;
  playerLabels: Readonly<Record<PlayerId, string>>;
  /** When set, exit is shown in the toolbar (ignored in `preview` mode). */
  onExit?: () => void;
  /** Empty board only: no toolbar, no input, for setup preview. */
  preview?: boolean;
}>;

/** Hot-seat dots game: drives the board with the local `useDotsGame` hook. */
export function DotsGamePlay({ config, playerLabels, onExit, preview = false }: DotsGamePlayProps): ReactElement {
  const game = useDotsGame(config);
  return <DotsBoardView config={config} playerLabels={playerLabels} game={game} onExit={onExit} preview={preview} />;
}
