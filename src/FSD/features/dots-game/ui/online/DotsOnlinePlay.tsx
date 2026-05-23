"use client";

import type { ReactElement } from "react";
import { useCallback } from "react";
import { useTranslations } from "next-intl";

import type { DotsRoomDetail } from "../../api/dotsOnlineApiTypes";
import { dispatchDotsApiError } from "../../api/useDotsApiErrors";
import { useRoomLive } from "../../api/useRoomLive";
import { useSendGameAction } from "../../api/useSendGameAction";
import { toClientGameConfig } from "../../model/boardConfig";
import { currentServerPlacingPlayer } from "../../model/serverReducer";
import type { PlayerId } from "../../model/types";
import type { CommitRejectedResult } from "../../model/useDotsOnlineGame";
import { useDotsOnlineGame } from "../../model/useDotsOnlineGame";

import { DotsBoardView } from "../play/DotsBoardView";
import styles from "./DotsOnlinePlay.module.css";
import { Icon } from "@/FSD/shared/ui/icon/Icon";

export type DotsOnlinePlayProps = Readonly<{
  room: DotsRoomDetail;
  userId: string;
  onExit: () => void;
}>;

type StatusTextArgs = Readonly<{
  room: DotsRoomDetail;
  isViewer: boolean;
  isMyTurn: boolean;
  t: ReturnType<typeof useTranslations>;
}>;

/** Resolves the user id for the player whose turn it currently is. */
function actingPlayerUserId(room: DotsRoomDetail): string | null {
  if (!room.serverState || room.serverState.mode !== "play") {
    return null;
  }
  const slot: PlayerId = currentServerPlacingPlayer(room.serverState);
  return slot === "player0" ? room.lockedPlayers.player0 : room.lockedPlayers.player1;
}

/** Picks the localized status text for the current participant role + turn. */
function computeStatusText(args: StatusTextArgs): string {
  const actingUserId = actingPlayerUserId(args.room);
  const isActingConnected = actingUserId === null || args.room.connectedUserIds.includes(actingUserId);
  if (args.room.status === "playing" && !isActingConnected) {
    return args.t("waitingForPlayerReconnect");
  }
  if (args.isViewer) {
    return args.t("viewingMode");
  }
  if (args.isMyTurn) {
    return args.t("yourTurn");
  }
  return args.t("waitingForOpponent");
}

/** Online play wrapper: drives `DotsBoardView` with `useDotsOnlineGame` + viewer / status chrome. */
export function DotsOnlinePlay({ room: initialRoom, userId, onExit }: DotsOnlinePlayProps): ReactElement {
  const t = useTranslations("DotsGame");
  const { room: liveRoom, applyRoomSnapshot } = useRoomLive(initialRoom.id);
  const room = liveRoom ?? initialRoom;
  const send = useSendGameAction(room.id);
  const onCommitRejected = useCallback(
    (result: CommitRejectedResult): void => {
      applyRoomSnapshot(result.snapshot);
      dispatchDotsApiError(t("serverRejected"));
    },
    [applyRoomSnapshot, t]
  );
  const online = useDotsOnlineGame({ room, userId, send, onCommitRejected });

  const { role } = online;
  const isViewer = role === "viewer";
  const statusText = computeStatusText({ room, isViewer, isMyTurn: online.isMyTurn, t });

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
    <DotsBoardView
      config={toClientGameConfig(room.config)}
      playerLabels={online.playerLabels}
      game={online}
      onExit={onExit}
      readOnly={isViewer}
      extraStatus={extraStatus}
    />
  );
}
