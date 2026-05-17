import type { DotsBoardConfig } from "../api/dotsOnlineApiTypes";
import { defaultDotsConfig } from "./logic";
import type { DotsGameConfig } from "./types";

/** Merges server board dimensions with client-only cell size for rendering. */
export function toClientGameConfig(board: DotsBoardConfig, cellSizePx?: number): DotsGameConfig {
  const defaults = defaultDotsConfig();
  return {
    rows: board.rows,
    cols: board.cols,
    cellSizePx: cellSizePx ?? defaults.cellSizePx
  };
}
