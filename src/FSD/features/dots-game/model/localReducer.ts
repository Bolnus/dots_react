import { areNeighbourCells } from "./logic";
import { INITIAL_LOCAL_STATE } from "./localState";
import type { DotsLocalState } from "./localState";
import { currentServerPlacingPlayer } from "./serverReducer";
import type { DotsServerGameState } from "./serverState";
import type { CellState, GridPoint, PlayerId } from "./types";

/** Discriminated union of client-only UI actions for the acting player. */
export type DotsLocalAction =
  | Readonly<{ type: "PLACE_LMB"; point: GridPoint }>
  | Readonly<{ type: "POLYGON_CLICK"; point: GridPoint }>
  | Readonly<{ type: "UNDO" }>
  | Readonly<{ type: "RESET" }>
  | Readonly<{ type: "REPLACE"; next: DotsLocalState }>;

/** True when two grid points are identical. */
function isSamePoint(a: GridPoint, b: GridPoint): boolean {
  return a.r === b.r && a.c === b.c;
}

/** Reads `cells[r][c]` defensively (returns `null` outside the grid). */
function cellAt(cells: CellState[][], point: GridPoint): CellState | null {
  return cells[point.r]?.[point.c] ?? null;
}

/** True when no committed dot exists on `point` and it is not blocked. */
function canPlaceAt(cells: CellState[][], point: GridPoint): boolean {
  const cell = cellAt(cells, point);
  if (!cell) {
    return false;
  }
  return !cell.blocked && cell.owner === null;
}

/** True when `point` is a non-blocked committed dot owned by `owner`. */
function isOwnDot(cells: CellState[][], point: GridPoint, owner: PlayerId): boolean {
  const cell = cellAt(cells, point);
  if (!cell) {
    return false;
  }
  return !cell.blocked && cell.owner === owner;
}

/** Begins an enclosure: chain starts at the pending dot and includes `target` as second vertex. */
function beginChainFromPending(state: DotsLocalState, target: GridPoint): DotsLocalState {
  if (!state.pendingDot) {
    return state;
  }
  return {
    mode: "drawPolygon",
    pendingDot: state.pendingDot,
    chainStart: state.pendingDot,
    chainPath: [state.pendingDot, target]
  };
}

/** Place-or-move semantics for a left click while in `play` mode. */
function handlePlaceLmb(
  state: DotsLocalState,
  server: DotsServerGameState,
  point: GridPoint,
  player: PlayerId
): DotsLocalState {
  if (state.mode !== "play") {
    return state;
  }
  if (state.pendingDot) {
    if (isSamePoint(state.pendingDot, point)) {
      return state;
    }
    if (canPlaceAt(server.cells, point)) {
      return { ...state, pendingDot: point };
    }
    if (isOwnDot(server.cells, point, player) && areNeighbourCells(state.pendingDot, point)) {
      return beginChainFromPending(state, point);
    }
    return state;
  }
  if (!canPlaceAt(server.cells, point)) {
    return state;
  }
  return { ...state, pendingDot: point };
}

/** Returns true when clicking `point` would extend the chain into a revisited non-start vertex. */
function chainRevisitsNonStart(state: DotsLocalState, point: GridPoint): boolean {
  if (!state.chainStart) {
    return false;
  }
  const start = state.chainStart;
  if (point.r === start.r && point.c === start.c) {
    return false;
  }
  return state.chainPath.some((vertex) => vertex.r === point.r && vertex.c === point.c);
}

/** Click handler for `drawPolygon` mode: extends the chain or appends the closing vertex. */
function handlePolygonClick(
  state: DotsLocalState,
  server: DotsServerGameState,
  point: GridPoint,
  player: PlayerId
): DotsLocalState {
  if (state.mode !== "drawPolygon" || !state.chainStart) {
    return state;
  }
  const last = state.chainPath[state.chainPath.length - 1];
  const start = state.chainStart;
  const closingStart = point.r === start.r && point.c === start.c && state.chainPath.length >= 3;
  if (closingStart && state.chainPath.length < 4) {
    return INITIAL_LOCAL_STATE;
  }
  if (chainRevisitsNonStart(state, point)) {
    return INITIAL_LOCAL_STATE;
  }
  if (closingStart) {
    if (!areNeighbourCells(last, start)) {
      return state;
    }
    return { ...state, chainPath: [...state.chainPath, point] };
  }
  if (!isOwnDot(server.cells, point, player)) {
    return state;
  }
  if (!areNeighbourCells(last, point)) {
    return state;
  }
  if (isSamePoint(point, last)) {
    return state;
  }
  return { ...state, chainPath: [...state.chainPath, point] };
}

/** Undo: cancel an in-progress chain or remove the pending dot; never reverts committed moves. */
function handleUndo(state: DotsLocalState): DotsLocalState {
  if (state.mode === "drawPolygon") {
    return INITIAL_LOCAL_STATE;
  }
  if (state.pendingDot) {
    return INITIAL_LOCAL_STATE;
  }
  return state;
}

/** Pure local-state transition for the acting player; treats server state as immutable context. */
export function reduceLocal(
  state: DotsLocalState,
  action: DotsLocalAction,
  server: DotsServerGameState
): DotsLocalState {
  if (server.mode === "ended") {
    return INITIAL_LOCAL_STATE;
  }
  const player = currentServerPlacingPlayer(server);
  switch (action.type) {
    case "PLACE_LMB":
      return handlePlaceLmb(state, server, action.point, player);
    case "POLYGON_CLICK":
      return handlePolygonClick(state, server, action.point, player);
    case "UNDO":
      return handleUndo(state);
    case "RESET":
      return INITIAL_LOCAL_STATE;
    case "REPLACE":
      return action.next;
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}

/** True when the chain is closed (4+ vertices, first === last) — caller should commit the capture. */
export function isChainClosed(state: DotsLocalState): boolean {
  if (state.mode !== "drawPolygon" || state.chainPath.length < 4) {
    return false;
  }
  const [first] = state.chainPath;
  const last = state.chainPath[state.chainPath.length - 1];
  return first.r === last.r && first.c === last.c;
}
