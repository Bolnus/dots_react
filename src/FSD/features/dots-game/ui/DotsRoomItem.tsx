"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import type { DotsRoomStatus, DotsRoomSummary } from "../api/dotsOnlineApiTypes";
import styles from "./DotsRoomItem.module.css";
import { Icon } from "@/FSD/shared/ui/icon/Icon";

export type DotsRoomItemProps = Readonly<{
  room: DotsRoomSummary;
  onOpen: (roomId: string) => void;
}>;

/** Returns the CSS class for the room status badge. */
function statusClassName(status: DotsRoomStatus): string {
  if (status === "waiting") {
    return styles.statusWaiting;
  }
  if (status === "playing") {
    return styles.statusPlaying;
  }
  return styles.statusFinished;
}

type StatusLabelArgs = Readonly<{
  status: DotsRoomStatus;
  playerCount: number;
  maxPlayers: number;
  t: ReturnType<typeof useTranslations>;
}>;

/** Returns the localized status label, embedding the player count for waiting rooms. */
function formatStatusLabel(args: StatusLabelArgs): string {
  if (args.status === "waiting") {
    return args.t("roomStatusWaiting", { filled: args.playerCount, total: args.maxPlayers });
  }
  if (args.status === "playing") {
    return args.t("roomStatusPlaying");
  }
  return args.t("roomStatusFinished");
}

/** A single row in the online rooms list (clickable; opens the room when clicked). */
export function DotsRoomItem({ room, onOpen }: DotsRoomItemProps): ReactElement {
  const t = useTranslations("DotsGame");
  const statusLabel = formatStatusLabel({
    status: room.status,
    playerCount: room.playerCount,
    maxPlayers: room.maxPlayers,
    t
  });

  return (
    <button type="button" className={styles.row} onClick={() => onOpen(room.id)} title={t("openRoom")}>
      <div className={styles.titleColumn}>
        <span className={styles.name}>{room.name}</span>
        <span className={styles.meta}>{room.ownerName}</span>
      </div>
      <span className={styles.gridLabel}>
        {room.config.rows}×{room.config.cols}
      </span>
      <span className={`${styles.statusBadge} ${statusClassName(room.status)}`}>{statusLabel}</span>
      <span className={styles.icons}>
        {room.isPrivate || room.hasPassword ? (
          <span className={styles.lockSlot}>
            <Icon iconName="lock" size="sm" title={t("private")} />
          </span>
        ) : null}
        {room.status === "playing" ? (
          <span
            className={styles.viewerBadge}
            aria-label={t("viewersCount", { count: room.viewerCount })}
            title={t("viewersBadgeAria")}
          >
            <Icon iconName="viewers" size="sm" />
            <span>{room.viewerCount}</span>
          </span>
        ) : null}
      </span>
      <span aria-hidden style={{ width: 1 }} />
    </button>
  );
}
