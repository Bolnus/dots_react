"use client";

import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import type { DotsRoomDetail } from "../../api/dotsOnlineApiTypes";
import { dispatchDotsApiError } from "../../api/useDotsApiErrors";
import { useRoomChat } from "../../api/useRoomChat";
import { useRoomLive } from "../../api/useRoomLive";
import { useSendGameAction } from "../../api/useSendGameAction";
import { toClientGameConfig } from "../../model/boardConfig";
import { currentServerPlacingPlayer } from "../../model/serverReducer";
import type { PlayerId } from "../../model/types";
import type { CommitRejectedResult } from "../../model/useDotsOnlineGame";
import { useDotsOnlineGame } from "../../model/useDotsOnlineGame";

import { ChatPanelHeader } from "../chat/ChatPanelHeader";
import { RoomChatPanel } from "../chat/RoomChatPanel";
import { DotsBoardView } from "../play/DotsBoardView";
import styles from "./DotsOnlinePlay.module.css";
import { Icon } from "@/FSD/shared/ui/icon/Icon";
import { ResponsiveTabLayout } from "@/FSD/shared/ui/responsive-tab-layout/ResponsiveTabLayout";

export type DotsOnlinePlayProps = Readonly<{
  room: DotsRoomDetail;
  userId: string;
  onExit: () => void;
}>;

type StatusTextArgs = Readonly<{
  room: DotsRoomDetail;
  isViewer: boolean;
  isMyTurn: boolean;
  isConnected: boolean;
  t: ReturnType<typeof useTranslations>;
}>;

type ChatHeaderInfo = Readonly<{
  opponentName: string;
  opponentUserId: string | null;
}>;

/** Resolves the user id for the player whose turn it currently is. */
function actingPlayerUserId(room: DotsRoomDetail): string | null {
  if (!room.serverState || room.serverState.mode !== "play") {
    return null;
  }
  const slot: PlayerId = currentServerPlacingPlayer(room.serverState);
  return slot === "player0" ? room.lockedPlayers.player0 : room.lockedPlayers.player1;
}

/** Returns true when the acting player is the room's AI opponent. */
function isActingAiPlayer(room: DotsRoomDetail, actingUserId: string | null): boolean {
  if (actingUserId === null) {
    return false;
  }
  const actingPlayer = room.players.find((player) => player.user.userId === actingUserId);
  return actingPlayer?.user.isAi === true;
}

/** Picks the localized status text for the current participant role + turn. */
function computeStatusText(args: StatusTextArgs): string {
  const actingUserId = actingPlayerUserId(args.room);
  const isActingConnected = actingUserId === null || args.room.connectedUserIds.includes(actingUserId);
  if (args.room.status === "playing" && !isActingConnected && !isActingAiPlayer(args.room, actingUserId)) {
    return args.t("waitingForPlayerReconnect");
  }
  if (args.room.status === "playing" && !args.isConnected) {
    return args.t("reconnecting");
  }
  if (args.isViewer) {
    return args.t("viewingMode");
  }
  if (args.isMyTurn) {
    return args.t("yourTurn");
  }
  return args.t("waitingForOpponent");
}

/** Resolves chat header label and opponent user id for read receipts. */
function chatHeaderInfo(room: DotsRoomDetail, userId: string): ChatHeaderInfo {
  const myPlayer = room.players.find((player) => player.user.userId === userId);
  if (myPlayer) {
    const other = room.players.find((player) => player.user.userId !== userId);
    return {
      opponentName: other?.user.displayName ?? room.name,
      opponentUserId: other?.user.userId ?? null
    };
  }
  const player0 = room.players.find((player) => player.slot === "player0");
  const player1 = room.players.find((player) => player.slot === "player1");
  if (player0 && player1) {
    return {
      opponentName: `${player0.user.displayName} — ${player1.user.displayName}`,
      opponentUserId: null
    };
  }
  return { opponentName: room.name, opponentUserId: null };
}

/** Online play wrapper: drives `DotsBoardView` with chat in a responsive tab layout. */
export function DotsOnlinePlay({ room: initialRoom, userId, onExit }: DotsOnlinePlayProps): ReactElement {
  const t = useTranslations("DotsGame");
  const [isSecondaryVisible, setIsSecondaryVisible] = useState(false);
  const { room: liveRoom, isConnected, applyRoomSnapshot } = useRoomLive(initialRoom.id);
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
  const chat = useRoomChat(room.id, userId, isSecondaryVisible);

  const { role } = online;
  const isViewer = role === "viewer";
  const statusText = computeStatusText({ room, isViewer, isMyTurn: online.isMyTurn, isConnected, t });
  const { opponentName, opponentUserId } = chatHeaderInfo(room, userId);

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
    <ResponsiveTabLayout
      primary={
        <DotsBoardView
          config={toClientGameConfig(room.config)}
          playerLabels={online.playerLabels}
          game={online}
          onExit={onExit}
          readOnly={isViewer}
          isMyTurn={online.isMyTurn}
          extraStatus={extraStatus}
        />
      }
      secondaryHeader={<ChatPanelHeader opponentName={opponentName} viewerCount={online.viewerCount} />}
      secondary={<RoomChatPanel userId={userId} opponentUserId={opponentUserId} readOnly={isViewer} chat={chat} />}
      openSecondaryIcon={chat.hasUnread ? "chatUnread" : "chat"}
      openPrimaryIcon="board"
      openSecondaryAriaLabel={t("chatToggleAria")}
      openPrimaryAriaLabel={t("gameToggleAria")}
      onSecondaryVisibilityChange={setIsSecondaryVisible}
    />
  );
}
