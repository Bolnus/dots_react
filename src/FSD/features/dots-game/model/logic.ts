import type { CellState, DotsGameConfig, GridPoint, PlayerId } from "./types";

/** King-neighbour (8-connected), matching Qt distance < sqrt(2)*scale + 1 on a square grid. */
export function areNeighbourCells(a: GridPoint, b: GridPoint): boolean {
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

/** Creates a fresh grid with empty, unblocked cells. */
export function createEmptyGrid(config: DotsGameConfig): CellState[][] {
  return Array.from({ length: config.rows }, () =>
    Array.from({ length: config.cols }, () => ({ owner: null, blocked: false }))
  );
}

/** Default board dimensions, aligned with the Qt grid spacing concept. */
export function defaultDotsConfig(): DotsGameConfig {
  return { rows: 8, cols: 8, cellSizePx: 20 };
}

/** Copies the 2D grid so reducer updates remain immutable. */
function cloneGrid(cells: CellState[][]): CellState[][] {
  return cells.map((row) => row.map((cell) => ({ ...cell })));
}

/**
 * Non-zero winding rule; ring is closed implicitly (last vertex → first).
 * Half-integer test point avoids many vertex/ray degeneracies on the integer grid.
 */
export function pointInPolygon(test: GridPoint, polygonRing: readonly GridPoint[]): boolean {
  if (polygonRing.length < 3) {
    return false;
  }
  const x = test.c + 0.5;
  const y = test.r + 0.5;
  let wn = 0;
  const n = polygonRing.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const yi = polygonRing[i].r;
    const xi = polygonRing[i].c;
    const yj = polygonRing[j].r;
    const xj = polygonRing[j].c;
    const cross = (xj - xi) * (y - yi) - (x - xi) * (yj - yi);
    if (yi <= y) {
      if (yj > y && cross > 0) {
        wn++;
      }
    } else if (yj <= y && cross < 0) {
      wn--;
    }
  }
  return wn !== 0;
}

/** Closed ring without repeating the first vertex at the end. */
export function ringFromChainPath(path: readonly GridPoint[]): GridPoint[] {
  if (path.length < 4) {
    return [];
  }
  const [first] = path;
  const last = path[path.length - 1];
  if (first.r !== last.r || first.c !== last.c) {
    return [];
  }
  return path.slice(0, -1);
}

/** True when `p` is one of the ring vertices (outline dots). */
function isRingVertex(p: GridPoint, ring: readonly GridPoint[]): boolean {
  for (const v of ring) {
    if (v.r === p.r && v.c === p.c) {
      return true;
    }
  }
  return false;
}

/**
 * True when `p` lies on the closed segment between `a` and `b` on the integer grid.
 * Edges can be orthogonal, diagonal, or longer collinear runs (because vertices may skip cells).
 */
function gridPointOnClosedSegment(p: GridPoint, a: GridPoint, b: GridPoint): boolean {
  const cross = (b.c - a.c) * (p.r - a.r) - (b.r - a.r) * (p.c - a.c);
  if (cross !== 0) {
    return false;
  }
  const minC = Math.min(a.c, b.c);
  const maxC = Math.max(a.c, b.c);
  const minR = Math.min(a.r, b.r);
  const maxR = Math.max(a.r, b.r);
  return p.c >= minC && p.c <= maxC && p.r >= minR && p.r <= maxR;
}

/** True when `p` lies on any edge of the polygon ring. */
function gridPointOnPolygonBoundary(p: GridPoint, ring: readonly GridPoint[]): boolean {
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    if (gridPointOnClosedSegment(p, a, b)) {
      return true;
    }
  }
  return false;
}

/**
 * Captured/painted point definition (Qt-like):
 * - any point strictly inside OR lying on the boundary is non-interactable,
 * - except the ring vertices themselves (player’s dots forming the outline).
 */
export function isCapturedByPolygon(p: GridPoint, ring: readonly GridPoint[]): boolean {
  if (ring.length < 3) {
    return false;
  }
  if (isRingVertex(p, ring)) {
    return false;
  }
  return pointInPolygon(p, ring) || gridPointOnPolygonBoundary(p, ring);
}

export type CaptureResult = Readonly<{
  ring: GridPoint[];
  /** Opponent dots that contribute to score. */
  scoredDots: GridPoint[];
  /** Cells that become blocked (captured area; excludes ring vertices). */
  blockedCells: GridPoint[];
}>;

/** Finds opponent dots inside the ring and returns the capture (or null if no score). */
export function computeCapture(
  cells: CellState[][],
  ring: readonly GridPoint[],
  capturer: PlayerId
): CaptureResult | null {
  if (ring.length < 3) {
    return null;
  }
  const opponent: PlayerId = capturer === 0 ? 1 : 0;
  const scoredDots: GridPoint[] = [];
  const blockedCells: GridPoint[] = [];

  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      const p: GridPoint = { r, c };
      if (!isCapturedByPolygon(p, ring)) {
        continue;
      }
      const cell = cells[r][c];
      blockedCells.push(p);
      if (cell.owner === opponent) {
        scoredDots.push(p);
      }
    }
  }

  if (scoredDots.length === 0) {
    return null;
  }

  return { ring: [...ring], scoredDots, blockedCells };
}

/** Marks all cells inside the capture as blocked (including empty intersections). */
export function applyCapture(grid: CellState[][], capture: CaptureResult): CellState[][] {
  const next = cloneGrid(grid);
  for (const { r, c } of capture.blockedCells) {
    const cell = next[r][c];
    next[r][c] = { owner: cell.owner, blocked: true };
  }
  return next;
}
