"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { useCreateRoomMutation } from "../../api/useCreateRoomMutation";
import { useJoinRoomMutation } from "../../api/useJoinRoomMutation";
import { useLeaveRoomMutation } from "../../api/useLeaveRoomMutation";
import { useRoomQuery } from "../../api/useRoomQuery";
import { DotsOnlineViewKind, type DotsOnlineView } from "../../model/orchestratorTypes";
import { createRoomFromDraft, exitGame, pickActiveRoomId, routeJoinedRoom } from "../../model/orchestratorUtils";
import { useOnlineIdentity } from "../../model/useOnlineIdentity";
import { DotsOrchestratorLoading } from "../lobby/DotsOrchestratorLoading";

import { DotsOnlinePlay } from "./DotsOnlinePlay";
import { DotsOnlineRoomSetup } from "./DotsOnlineRoomSetup";
import { DotsOnlineRoomsView } from "./DotsOnlineRoomsView";
import styles from "./DotsOnlineSetup.module.css";

export type DotsOnlineSetupProps = Readonly<{
  onBackToLobby: () => void;
}>;

/** Online flow: rooms list, room setup, and live play. */
export function DotsOnlineSetup({ onBackToLobby }: DotsOnlineSetupProps): ReactElement | null {
  const t = useTranslations("DotsGame");
  const queryClient = useQueryClient();
  const { identity, setDisplayName } = useOnlineIdentity();
  const [view, setView] = useState<DotsOnlineView>({ kind: DotsOnlineViewKind.List });

  const { mutate: createRoom, data: createdRoom, isPending: isCreating, reset: resetCreate } = useCreateRoomMutation();
  const {
    mutate: joinRoom,
    data: joinedRoom,
    error: joinMutationError,
    isPending: isJoining,
    reset: resetJoin,
    variables: joinVariables
  } = useJoinRoomMutation();
  const {
    mutate: leaveRoom,
    isPending: isLeaving,
    isSuccess: didLeaveSucceed,
    isError: didLeaveFail,
    reset: resetLeave
  } = useLeaveRoomMutation();

  const { data: activeRoom } = useRoomQuery(pickActiveRoomId(view));

  useEffect(() => {
    if (createdRoom) {
      setView({ kind: DotsOnlineViewKind.Room, roomId: createdRoom.id });
      resetCreate();
    }
  }, [createdRoom, resetCreate]);

  useEffect(() => {
    if (joinedRoom) {
      routeJoinedRoom({ room: joinedRoom, setView });
      resetJoin();
    }
  }, [joinedRoom, resetJoin]);

  useEffect(() => {
    if (didLeaveSucceed || didLeaveFail) {
      setView({ kind: DotsOnlineViewKind.List });
      resetLeave();
    }
  }, [didLeaveSucceed, didLeaveFail, resetLeave]);

  const portalRoot = useMemo(() => (typeof document !== "undefined" ? document.body : null), []);

  if (view.kind === DotsOnlineViewKind.List) {
    return (
      <DotsOnlineRoomsView
        identity={identity}
        isJoining={isJoining}
        joiningRoomId={joinVariables?.roomId ?? null}
        joinMutationError={joinMutationError}
        queryClient={queryClient}
        joinRoom={joinRoom}
        setDisplayName={setDisplayName}
        setView={setView}
        onBackToLobby={onBackToLobby}
        onJoinErrorHandled={resetJoin}
      />
    );
  }
  if (!identity?.displayName) {
    return null;
  }
  if (view.kind === DotsOnlineViewKind.RoomDraft) {
    return (
      <DotsOnlineRoomSetup
        roomId={null}
        userId={identity.userId}
        isCreating={isCreating}
        onBack={() => setView({ kind: DotsOnlineViewKind.List })}
        onGameStarted={(roomId) => setView({ kind: DotsOnlineViewKind.Play, roomId })}
        onLeftRoom={() => setView({ kind: DotsOnlineViewKind.List })}
        onCreateRoom={(draft) => createRoomFromDraft({ draft, identity, createRoom })}
      />
    );
  }
  if (!activeRoom) {
    return <DotsOrchestratorLoading label={t("connectingToRoom")} />;
  }
  if (view.kind === DotsOnlineViewKind.Room) {
    return (
      <DotsOnlineRoomSetup
        roomId={view.roomId}
        userId={identity.userId}
        isCreating={false}
        onBack={() => setView({ kind: DotsOnlineViewKind.List })}
        onGameStarted={(roomId) => setView({ kind: DotsOnlineViewKind.Play, roomId })}
        onLeftRoom={() => setView({ kind: DotsOnlineViewKind.List })}
        onCreateRoom={(draft) => createRoomFromDraft({ draft, identity, createRoom })}
      />
    );
  }
  const play = (
    <DotsOnlinePlay
      room={activeRoom}
      userId={identity.userId}
      isLeaving={isLeaving}
      onExit={() => exitGame({ view, identity, leaveRoom, setView })}
    />
  );
  return portalRoot ? createPortal(<div className={styles.playPortalRoot}>{play}</div>, portalRoot) : play;
}
