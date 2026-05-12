import type { GridPoint } from "./types";

/** Local-only UI mode: `play` (idle) or `drawPolygon` (mid-enclosure). */
export type DotsLocalMode = "play" | "drawPolygon";

/** Ephemeral, client-side dots state for the acting player (not part of the server hash). */
export type DotsLocalState = Readonly<{
  mode: DotsLocalMode;
  /** Uncommitted dot for the current turn (movable until ACCEPT or capture). */
  pendingDot: GridPoint | null;
  /** Fixed start of the in-progress enclosure (matches the pending dot when set). */
  chainStart: GridPoint | null;
  /** Vertices of the enclosure trace in click order. */
  chainPath: GridPoint[];
}>;

/** Empty local state (no pending placement, no in-progress polygon). */
export const INITIAL_LOCAL_STATE: DotsLocalState = {
  mode: "play",
  pendingDot: null,
  chainStart: null,
  chainPath: []
};

/** Best-effort equality check; safe for cheap React re-render skipping. */
export function isSameLocalState(a: DotsLocalState, b: DotsLocalState): boolean {
  if (a === b) {
    return true;
  }
  if (a.mode !== b.mode) {
    return false;
  }
  if (a.pendingDot === null) {
    if (b.pendingDot !== null) {
      return false;
    }
  } else if (b.pendingDot === null || a.pendingDot.r !== b.pendingDot.r || a.pendingDot.c !== b.pendingDot.c) {
    return false;
  }
  if (a.chainStart === null) {
    if (b.chainStart !== null) {
      return false;
    }
  } else if (b.chainStart === null || a.chainStart.r !== b.chainStart.r || a.chainStart.c !== b.chainStart.c) {
    return false;
  }
  if (a.chainPath.length !== b.chainPath.length) {
    return false;
  }
  for (let i = 0; i < a.chainPath.length; i++) {
    if (a.chainPath[i].r !== b.chainPath[i].r || a.chainPath[i].c !== b.chainPath[i].c) {
      return false;
    }
  }
  return true;
}
