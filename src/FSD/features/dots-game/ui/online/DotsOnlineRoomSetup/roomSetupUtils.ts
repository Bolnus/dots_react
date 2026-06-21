import type { useTranslations } from "next-intl";

import type { DotsRoomDetail } from "../../../api/dotsOnlineApiTypes";
import { isValidGridDimension, persistDefaultGridDimensions } from "../../../model/logic";
import type { DotsGameConfig, PlayerId } from "../../../model/types";
import type { RosterUser } from "../../roster/RosterPanel";

import type { CreateRoomDraft, DraftFormState } from "./types";

export const PLAYER_SLOTS = 2;

/** Drops stale waiting-room WS snapshots that race with add-AI or drop a known AI player. */
export function shouldApplyIncomingRoomSnapshot({
  isAddingAi,
  isPatching,
  prev,
  next
}: Readonly<{
  isAddingAi: boolean;
  isPatching: boolean;
  prev: DotsRoomDetail | null;
  next: DotsRoomDetail;
}>): boolean {
  if (isAddingAi && next.players.length < PLAYER_SLOTS) {
    return false;
  }
  if (isPatching || prev === null) {
    return true;
  }
  const previousAi = prev.players.find((player) => player.user.isAi);
  if (previousAi && !next.players.some((player) => player.user.userId === previousAi.user.userId)) {
    return false;
  }
  return true;
}

type EffectiveConfigArgs = Readonly<{
  rows: number | undefined;
  cols: number | undefined;
  defaults: DotsGameConfig;
}>;

/** Falls back to defaults when inputs are out of range; produces a preview-friendly config. */
export function buildEffectiveConfig(args: EffectiveConfigArgs): DotsGameConfig {
  return {
    rows: isValidGridDimension(args.rows) ? args.rows : args.defaults.rows,
    cols: isValidGridDimension(args.cols) ? args.cols : args.defaults.cols,
    cellSizePx: args.defaults.cellSizePx
  };
}

/** Builds the labels record from the live room (falls back to defaults). */
export function buildPlayerLabels(
  room: DotsRoomDetail,
  t: ReturnType<typeof useTranslations>
): Readonly<Record<PlayerId, string>> {
  return {
    player0: room.players.find((player) => player.slot === "player0")?.user.displayName ?? t("player0"),
    player1: room.players.find((player) => player.slot === "player1")?.user.displayName ?? t("player1")
  };
}

/** Sorts roster users so the player0 slot lands first; keeps original order otherwise. */
export function sortedPlayerUsers(room: DotsRoomDetail): RosterUser[] {
  const sorted = room.players.slice().sort((left, right) => {
    if (left.slot === right.slot) {
      return 0;
    }
    if (left.slot === "player0") {
      return -1;
    }
    return 1;
  });
  return sorted.map((player) => player.user);
}

type SubmitDraftArgs = Readonly<{
  draft: DraftFormState;
  defaults: DotsGameConfig;
  onCreateRoom: (draft: CreateRoomDraft) => void;
}>;

/** Builds the create-room payload from the draft form state and forwards it to the parent. */
export function submitDraft(args: SubmitDraftArgs): void {
  const effectiveConfig = buildEffectiveConfig({
    rows: args.draft.rows,
    cols: args.draft.cols,
    defaults: args.defaults
  });
  persistDefaultGridDimensions(effectiveConfig.rows, effectiveConfig.cols);
  args.onCreateRoom({
    name: args.draft.name,
    config: effectiveConfig,
    password: args.draft.password
  });
}
