"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { useCreateRoomMutation } from "../api/useCreateRoomMutation";
import { useJoinRoomMutation } from "../api/useJoinRoomMutation";
import { useLeaveRoomMutation } from "../api/useLeaveRoomMutation";
import { useRoomQuery } from "../api/useRoomQuery";
import { useOnlineIdentity } from "../model/useOnlineIdentity";

import styles from "./DotsGame.module.css";
import { createRoomFromDraft, exitGame, pickActiveRoomId, routeJoinedRoom } from "./DotsGameOrchestratorUtils";
import { DotsViewKind, type DotsView } from "./DotsGameOrchestratorTypes";
import { DotsHotSeatSetup } from "./DotsHotSeatSetup";
import { DotsMainMenu } from "./DotsMainMenu";
import { DotsOnlinePlay } from "./DotsOnlinePlay";
import { DotsOnlineRoomSetup } from "./DotsOnlineRoomSetup";
import { DotsOnlineRoomsView } from "./DotsOnlineRoomsView";
import { DotsOrchestratorLoading } from "./DotsOrchestratorLoading";

/** Top-level dots-feature orchestrator: routes between lobby / hot-seat / online flows. */
export function DotsGame(): ReactElement | null {
  const t = useTranslations("DotsGame");
  const queryClient = useQueryClient();
  const { identity, setDisplayName } = useOnlineIdentity();
  const [view, setView] = useState<DotsView>({ kind: DotsViewKind.Lobby });

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
      setView({ kind: DotsViewKind.OnlineRoom, roomId: createdRoom.id });
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
      setView({ kind: DotsViewKind.OnlineList });
      resetLeave();
    }
  }, [didLeaveSucceed, didLeaveFail, resetLeave]);

  const portalRoot = useMemo(() => (typeof document !== "undefined" ? document.body : null), []);

  if (view.kind === DotsViewKind.Lobby) {
    return (
      <DotsMainMenu
        onPickOnline={() => setView({ kind: DotsViewKind.OnlineList })}
        onPickHotSeat={() => setView({ kind: DotsViewKind.HotSeat })}
      />
    );
  }
  if (view.kind === DotsViewKind.HotSeat) {
    return <DotsHotSeatSetup onBack={() => setView({ kind: DotsViewKind.Lobby })} />;
  }
  if (view.kind === DotsViewKind.OnlineList) {
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
        onJoinErrorHandled={resetJoin}
      />
    );
  }
  if (!identity?.displayName) {
    return null;
  }
  if (view.kind === DotsViewKind.OnlineRoomDraft) {
    return (
      <DotsOnlineRoomSetup
        roomId={null}
        userId={identity.userId}
        isCreating={isCreating}
        onBack={() => setView({ kind: DotsViewKind.OnlineList })}
        onGameStarted={(roomId) => setView({ kind: DotsViewKind.OnlinePlay, roomId })}
        onLeftRoom={() => setView({ kind: DotsViewKind.OnlineList })}
        onCreateRoom={(draft) => createRoomFromDraft({ draft, identity, createRoom })}
      />
    );
  }
  if (!activeRoom) {
    return <DotsOrchestratorLoading label={t("connectingToRoom")} />;
  }
  if (view.kind === DotsViewKind.OnlineRoom) {
    return (
      <DotsOnlineRoomSetup
        roomId={view.roomId}
        userId={identity.userId}
        isCreating={false}
        onBack={() => setView({ kind: DotsViewKind.OnlineList })}
        onGameStarted={(roomId) => setView({ kind: DotsViewKind.OnlinePlay, roomId })}
        onLeftRoom={() => setView({ kind: DotsViewKind.OnlineList })}
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
