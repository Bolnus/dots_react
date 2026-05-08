import {
  applyCapture,
  areNeighbourCells,
  computeCapture,
  createEmptyGrid,
  defaultDotsConfig,
  ringFromChainPath
} from "./logic";
import type { DotsGameAction, DotsGameState, FilledPolygon, GridPoint, PlayerId, UndoEntry } from "./types";

/** Initial board, scores, and empty polygon state for a new session. */
export function initialDotsGameState(): DotsGameState {
  const config = defaultDotsConfig();
  return {
    config,
    cells: createEmptyGrid(config),
    dotsPlacedCount: 0,
    scores: { player0: 0, player1: 0 },
    mode: "play",
    winner: null,
    surrenderedBy: null,
    chainStart: null,
    chainPath: [],
    polygons: [],
    undoStack: []
  };
}

/** Player to place the next dot: even count → player 0, odd → player 1. */
function currentPlacingPlayer(dotsPlacedCount: number): PlayerId {
  return dotsPlacedCount % 2 === 0 ? "player0" : "player1";
}

/** True when the intersection is empty and not blocked by a prior capture. */
function canPlaceAt(cells: DotsGameState["cells"], p: GridPoint): boolean {
  const cell = cells[p.r][p.c];
  return !cell.blocked && cell.owner === null;
}

/** Records a placed dot so Undo can pop it in order. */
function pushPlacement(state: DotsGameState, point: GridPoint): DotsGameState {
  const entry: UndoEntry = { type: "placement", point };
  return {
    ...state,
    undoStack: [...state.undoStack, entry]
  };
}

/** Pops the last undo step (placement or capture). */
function popUndoEntry(state: DotsGameState): DotsGameState {
  const stack = [...state.undoStack];
  const last = stack.pop();
  if (!last) {
    return state;
  }
  if (last.type === "placement") {
    const cells = state.cells.map((row) => row.map((c) => ({ ...c })));
    cells[last.point.r][last.point.c] = { owner: null, blocked: false };
    return {
      ...state,
      cells,
      undoStack: stack,
      dotsPlacedCount: Math.max(0, state.dotsPlacedCount - 1)
    };
  }
  const cells = state.cells.map((row) => row.map((c) => ({ ...c })));
  for (const p of last.blockedCells) {
    const cell = cells[p.r][p.c];
    cells[p.r][p.c] = { owner: cell.owner, blocked: false };
  }
  const { capturer, scoredCount, enclosureStarter } = last;
  cells[enclosureStarter.r][enclosureStarter.c] = { owner: null, blocked: false };

  let undoStack = stack;
  const prev = undoStack[undoStack.length - 1];
  if (prev?.type === "placement" && prev.point.r === enclosureStarter.r && prev.point.c === enclosureStarter.c) {
    undoStack = undoStack.slice(0, -1);
  }

  const polygons = state.polygons.slice(0, -1);
  return {
    ...state,
    cells,
    undoStack,
    polygons,
    scores: {
      ...state.scores,
      [capturer]: state.scores[capturer] - scoredCount
    },
    dotsPlacedCount: Math.max(0, state.dotsPlacedCount - 1)
  };
}

/** Aborts enclosure mode and removes the RMB starter dot if one was placed. */
function cancelPolygonDrawing(state: DotsGameState): DotsGameState {
  let next: DotsGameState = { ...state, mode: "play", chainStart: null, chainPath: [] };
  if (state.chainStart) {
    next = popUndoEntry(next);
  }
  return next;
}

/** Applies a closed chain: scores and blocks only when the ring surrounds opponent dots. */
function tryClosePolygon(state: DotsGameState): DotsGameState {
  const ring = ringFromChainPath(state.chainPath);
  if (!state.chainStart || ring.length < 3) {
    return cancelPolygonDrawing(state);
  }
  const capturerCell = state.cells[state.chainStart.r][state.chainStart.c];
  const capturer = capturerCell.owner;
  if (capturer === null) {
    return cancelPolygonDrawing(state);
  }
  const capture = computeCapture(state.cells, ring, capturer);
  if (!capture) {
    return cancelPolygonDrawing(state);
  }
  const scored = capture.scoredDots.length;
  const scores: DotsGameState["scores"] = {
    ...state.scores,
    [capturer]: state.scores[capturer] + scored
  };
  const newPolygon: FilledPolygon = { owner: capturer, ring: capture.ring };
  const cellsAfter = applyCapture(state.cells, capture);
  const starter = state.chainStart;
  const captureUndo: UndoEntry = {
    type: "capture",
    capturer,
    scoredCount: scored,
    blockedCells: capture.blockedCells.map((p) => ({ r: p.r, c: p.c })),
    enclosureStarter: { r: starter.r, c: starter.c }
  };
  return {
    ...state,
    cells: cellsAfter,
    scores,
    mode: "play",
    chainStart: null,
    chainPath: [],
    polygons: [...state.polygons, newPolygon],
    undoStack: [...state.undoStack, captureUndo]
  };
}

/** Player who surrenders: the one finishing an enclosure, or whose turn it is to place. */
function surrenderLoser(state: DotsGameState): PlayerId {
  if (state.mode === "drawPolygon" && state.dotsPlacedCount > 0) {
    return currentPlacingPlayer(state.dotsPlacedCount - 1);
  }
  return currentPlacingPlayer(state.dotsPlacedCount);
}

/** Ends the match with the opponent as winner. */
function handleSurrender(state: DotsGameState): DotsGameState {
  if (state.mode === "ended") {
    return state;
  }
  const loser = surrenderLoser(state);
  const winner: PlayerId = loser === "player0" ? "player1" : "player0";
  return {
    ...state,
    mode: "ended",
    winner,
    surrenderedBy: loser,
    chainStart: null,
    chainPath: []
  };
}

/** Esc / Undo: cancel enclosure or remove the last placed dot. */
function handleUndo(state: DotsGameState): DotsGameState {
  if (state.mode === "drawPolygon") {
    return cancelPolygonDrawing(state);
  }
  if (state.undoStack.length === 0) {
    return state;
  }
  return popUndoEntry(state);
}

/** Normal move: place current player’s dot on a free intersection. */
function handlePlaceLmb(state: DotsGameState, point: GridPoint): DotsGameState {
  if (state.mode !== "play") {
    return state;
  }
  if (!canPlaceAt(state.cells, point)) {
    return state;
  }
  const player = currentPlacingPlayer(state.dotsPlacedCount);
  const cells = state.cells.map((row) => row.map((c) => ({ ...c })));
  cells[point.r][point.c] = { owner: player, blocked: false };
  return pushPlacement(
    {
      ...state,
      cells,
      dotsPlacedCount: state.dotsPlacedCount + 1
    },
    point
  );
}

/** Places a dot and enters enclosure mode from that intersection (Qt RMB). */
function handlePlaceRmb(state: DotsGameState, point: GridPoint): DotsGameState {
  if (state.mode !== "play") {
    return state;
  }
  if (!canPlaceAt(state.cells, point)) {
    return state;
  }
  const player = currentPlacingPlayer(state.dotsPlacedCount);
  const cells = state.cells.map((row) => row.map((c) => ({ ...c })));
  cells[point.r][point.c] = { owner: player, blocked: false };
  const placed = pushPlacement(
    {
      ...state,
      cells,
      dotsPlacedCount: state.dotsPlacedCount + 1
    },
    point
  );
  return {
    ...placed,
    mode: "drawPolygon",
    chainStart: point,
    chainPath: [point]
  };
}

/** Extends the chain or closes back on the start when neighbours and capture rules allow. */
function handlePolygonClick(state: DotsGameState, point: GridPoint): DotsGameState {
  if (state.mode !== "drawPolygon" || !state.chainStart) {
    return state;
  }
  const last = state.chainPath[state.chainPath.length - 1];
  const start = state.chainStart;
  const capturerCell = state.cells[start.r][start.c];
  if (capturerCell.owner === null) {
    return cancelPolygonDrawing(state);
  }
  const capturer = capturerCell.owner;

  const closingStart = point.r === start.r && point.c === start.c && state.chainPath.length >= 3;
  if (closingStart && state.chainPath.length < 4) {
    return cancelPolygonDrawing(state);
  }

  const revisitsNonStartVertex =
    state.chainPath.some((p) => p.r === point.r && p.c === point.c) && (point.r !== start.r || point.c !== start.c);
  if (revisitsNonStartVertex) {
    return cancelPolygonDrawing(state);
  }

  if (closingStart) {
    if (!areNeighbourCells(last, start)) {
      return state;
    }
    const withClose: DotsGameState = {
      ...state,
      chainPath: [...state.chainPath, point]
    };
    return tryClosePolygon(withClose);
  }

  const target = state.cells[point.r][point.c];
  if (target.owner !== capturer || target.blocked) {
    return state;
  }
  if (!areNeighbourCells(last, point)) {
    return state;
  }
  if (point.r === last.r && point.c === last.c) {
    return state;
  }
  return {
    ...state,
    chainPath: [...state.chainPath, point]
  };
}

/** Pure state transition for the dots game (play, enclosure, undo, clear, surrender). */
export function reduceDotsGame(state: DotsGameState, action: DotsGameAction): DotsGameState {
  if (state.mode === "ended" && action.type !== "CLEAR") {
    return state;
  }

  switch (action.type) {
    case "CLEAR":
      return initialDotsGameState();
    case "SURRENDER":
      return handleSurrender(state);
    case "UNDO":
      return handleUndo(state);
    case "PLACE_LMB":
      return handlePlaceLmb(state, action.point);
    case "PLACE_RMB":
      return handlePlaceRmb(state, action.point);
    case "POLYGON_CLICK":
      return handlePolygonClick(state, action.point);
    default:
      return state;
  }
}

export { currentPlacingPlayer };
