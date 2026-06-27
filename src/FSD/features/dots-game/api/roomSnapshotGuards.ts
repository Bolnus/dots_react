import type { DotsRoomDetail } from "./dotsOnlineApiTypes";

/** Drops stale in-game WS snapshots that regress authoritative server progress. */
export function shouldApplyIncomingPlayRoomSnapshot(prev: DotsRoomDetail | null, next: DotsRoomDetail): boolean {
  if (prev === null) {
    return true;
  }
  if (prev.status === "playing" && next.status === "waiting") {
    return false;
  }
  if (
    prev.serverState?.mode === "play" &&
    next.serverState?.mode === "play" &&
    next.serverState.dotsPlacedCount < prev.serverState.dotsPlacedCount
  ) {
    return false;
  }
  if (prev.serverState?.mode === "ended" && next.serverState?.mode === "play") {
    return false;
  }
  return true;
}
