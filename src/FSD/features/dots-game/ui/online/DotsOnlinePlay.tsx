"use client";

import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import type { DotsRoomDetail } from "../../api/dotsOnlineApiTypes";
import { shouldApplyIncomingPlayRoomSnapshot } from "../../api/roomSnapshotGuards";
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
import { useMediaMinWidth } from "@/FSD/shared/lib/hooks/useMediaMinWidth";
import { SectionFetching } from "@/FSD/shared/ui/section-fetching/SectionFetching";

export type DotsOnlinePlayProps = Readonly<{
  roomId: string;
  userId: string;
  onExit: () => void;
}>;

type ActiveTab = "primary" | "secondary";

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

const LAYOUT_BREAKPOINT_PX = 900;

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

type TabNavCallbacks = Readonly<{
  onChatView?: () => void;
  onBoardView?: () => void;
}>;

/** Resolves narrow-layout tab switch callbacks; undefined hides the corresponding button. */
function resolveTabNavCallbacks(
  isWide: boolean,
  activeTab: ActiveTab,
  setActiveTab: (tab: ActiveTab) => void
): TabNavCallbacks {
  return {
    onChatView: !isWide && activeTab === "primary" ? () => setActiveTab("secondary") : undefined,
    onBoardView: !isWide && activeTab === "secondary" ? () => setActiveTab("primary") : undefined
  };
}

/** Online play wrapper: drives `DotsBoardView` with an owned board/chat tab layout. */
export function DotsOnlinePlay({ roomId, userId, onExit }: DotsOnlinePlayProps): ReactElement {
  const t = useTranslations("DotsGame");
  const shouldApplyRoomEvent = useCallback(
    (prev: DotsRoomDetail | null, next: DotsRoomDetail) => shouldApplyIncomingPlayRoomSnapshot(prev, next),
    []
  );
  const { room, isConnected, applyRoomSnapshot } = useRoomLive(roomId, { shouldApplyRoomEvent });

  if (!room) {
    return <SectionFetching label={t("connectingToRoom")} />;
  }

  return (
    <DotsOnlinePlayBody
      room={room}
      userId={userId}
      onExit={onExit}
      isConnected={isConnected}
      applyRoomSnapshot={applyRoomSnapshot}
    />
  );
}

type DotsOnlinePlayBodyProps = Readonly<{
  room: DotsRoomDetail;
  userId: string;
  onExit: () => void;
  isConnected: boolean;
  applyRoomSnapshot: (snapshot: DotsRoomDetail) => void;
}>;

/** Renders the board and chat panels once the live room snapshot is available. */
function DotsOnlinePlayBody({
  room,
  userId,
  onExit,
  isConnected,
  applyRoomSnapshot
}: DotsOnlinePlayBodyProps): ReactElement {
  const t = useTranslations("DotsGame");
  const isWide = useMediaMinWidth(LAYOUT_BREAKPOINT_PX);
  const [activeTab, setActiveTab] = useState<ActiveTab>("primary");
  const isSecondaryVisible = isWide || activeTab === "secondary";
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
  const showPrimary = isWide || activeTab === "primary";
  const showSecondary = isWide || activeTab === "secondary";
  const { onChatView, onBoardView } = resolveTabNavCallbacks(isWide, activeTab, setActiveTab);
  const showViewerBadge = room.status === "playing" || room.status === "finished";

  return (
    <div className={isWide ? styles.rootWide : styles.rootNarrow}>
      <div className={showPrimary ? styles.primarySlot : styles.hiddenSlot}>
        <DotsBoardView
          config={toClientGameConfig(room.config)}
          playerLabels={online.playerLabels}
          game={online}
          onExit={onExit}
          readOnly={isViewer}
          isMyTurn={online.isMyTurn}
          extraStatus={{
            statusText,
            showViewerBadge,
            viewerCount: online.viewerCount
          }}
          onChatView={onChatView}
          hasUnreadChat={chat.hasUnread}
        />
      </div>
      <div className={showSecondary ? styles.secondarySlot : styles.hiddenSlot}>
        <div className={styles.secondaryPanel}>
          <ChatPanelHeader
            opponentName={opponentName}
            viewerCount={online.viewerCount}
            onBoardView={onBoardView}
            isMyTurn={online.isMyTurn}
          />
          <RoomChatPanel
            userId={userId}
            opponentUserId={opponentUserId}
            readOnly={isViewer || room.status === "finished"}
            chat={chat}
          />
        </div>
      </div>
    </div>
  );
}
