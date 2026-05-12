import type { DotsLocalState } from "./localState";
import { currentServerPlacingPlayer } from "./serverReducer";
import type { DotsServerGameState } from "./serverState";
import type { CellState, GridPoint } from "./types";

/** Subset of `DotsGameState` consumed by `DotsGamePlay` rendering. */
export type DotsRenderState = Readonly<{
  config: DotsServerGameState["config"];
  cells: DotsServerGameState["cells"];
  scores: DotsServerGameState["scores"];
  mode: "play" | "drawPolygon" | "ended";
  pendingDot: DotsLocalState["pendingDot"];
  chainStart: DotsLocalState["chainStart"];
  chainPath: DotsLocalState["chainPath"];
  polygons: DotsServerGameState["polygons"];
  winner: DotsServerGameState["winner"];
  surrenderedBy: DotsServerGameState["surrenderedBy"];
}>;

/** Returns a new cell grid with `point` overlaid as the acting player's pending dot. */
function overlayPendingDot(
  cells: CellState[][],
  pendingDot: GridPoint,
  ownerForCell: CellState["owner"]
): CellState[][] {
  return cells.map((row, rowIndex) =>
    row.map(
      (cell, colIndex): CellState =>
        rowIndex === pendingDot.r && colIndex === pendingDot.c ? { owner: ownerForCell, blocked: false } : cell
    )
  );
}

/** Combines the authoritative server state and the active player's local UI state into a render snapshot. */
export function buildRenderState(server: DotsServerGameState, local: DotsLocalState): DotsRenderState {
  const acting = server.mode === "ended" ? null : currentServerPlacingPlayer(server);
  const cells = local.pendingDot && acting ? overlayPendingDot(server.cells, local.pendingDot, acting) : server.cells;
  let mode: DotsRenderState["mode"];
  if (server.mode === "ended") {
    mode = "ended";
  } else if (local.mode === "drawPolygon") {
    mode = "drawPolygon";
  } else {
    mode = "play";
  }
  return {
    config: server.config,
    cells,
    scores: server.scores,
    mode,
    pendingDot: server.mode === "ended" ? null : local.pendingDot,
    chainStart: server.mode === "ended" ? null : local.chainStart,
    chainPath: server.mode === "ended" ? [] : local.chainPath,
    polygons: server.polygons,
    winner: server.winner,
    surrenderedBy: server.surrenderedBy
  };
}
