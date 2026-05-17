"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import type { DotsRoomDetail } from "../../api/dotsOnlineApiTypes";
import { useRoomLive } from "../../api/useRoomLive";
import { useSendGameAction } from "../../api/useSendGameAction";
import { toClientGameConfig } from "../../model/boardConfig";
import { useDotsOnlineGame } from "../../model/useDotsOnlineGame";

import { DotsBoardView } from "../play/DotsBoardView";
import styles from "./DotsOnlinePlay.module.css";
import { Icon } from "@/FSD/shared/ui/icon/Icon";

export type DotsOnlinePlayProps = Readonly<{
  room: DotsRoomDetail;
  userId: string;
  /** True while the parent's leave-room mutation is in flight; disables the exit button. */
  isLeaving?: boolean;
  onExit: () => void;
}>;

type StatusTextArgs = Readonly<{
  isViewer: boolean;
  isMyTurn: boolean;
  t: ReturnType<typeof useTranslations>;
}>;

/** Picks the localized status text for the current participant role + turn. */
function computeStatusText(args: StatusTextArgs): string {
  if (args.isViewer) {
    return args.t("viewingMode");
  }
  if (args.isMyTurn) {
    return args.t("yourTurn");
  }
  return args.t("waitingForOpponent");
}

/** Online play wrapper: drives `DotsBoardView` with `useDotsOnlineGame` + viewer / status chrome. */
export function DotsOnlinePlay({
  room: initialRoom,
  userId,
  isLeaving = false,
  onExit
}: DotsOnlinePlayProps): ReactElement {
  const t = useTranslations("DotsGame");
  const live = useRoomLive(initialRoom.id);
  const room = live.room ?? initialRoom;
  const send = useSendGameAction(room.id);
  const online = useDotsOnlineGame({ room, userId, send });

  const { role } = online;
  const isViewer = role === "viewer";
  const statusText = computeStatusText({ isViewer, isMyTurn: online.isMyTurn, t });

  const extraStatus = (
    <div className={styles.statusBarRight}>
      <span>{statusText}</span>
      {room.status === "playing" || room.status === "finished" ? (
        <span
          className={styles.viewerBadge}
          aria-label={t("viewersCount", { count: online.viewerCount })}
          title={t("viewersBadgeAria")}
        >
          <Icon iconName="viewers" size="sm" />
          <span>{online.viewerCount}</span>
        </span>
      ) : null}
    </div>
  );

  return (
    <div className={styles.wrap}>
      <DotsBoardView
        config={toClientGameConfig(room.config)}
        playerLabels={online.playerLabels}
        game={online}
        onExit={onExit}
        exitDisabled={isLeaving}
        readOnly={isViewer}
        extraStatus={extraStatus}
      />
    </div>
  );
}
