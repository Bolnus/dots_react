"use client";

import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { setDotsApiLocaleProvider } from "../../api/dotsHttpClient";
import { useDotsApiErrors } from "../../api/useDotsApiErrors";
import { useCreateRoomMutation } from "../../api/useCreateRoomMutation";
import { useJoinRoomMutation } from "../../api/useJoinRoomMutation";
import { useRoomQuery } from "../../api/useRoomQuery";
import { useSessionQuery } from "../../api/useSessionQuery";
import { DotsOnlineViewKind, type DotsOnlineView } from "../../model/orchestratorTypes";
import {
  createRoomFromDraft,
  exitGame,
  pickActiveRoomId,
  routeJoinedRoom,
  tryAutoReconnectActiveGame
} from "../../model/orchestratorUtils";
import { useOnlineIdentity } from "../../model/useOnlineIdentity";
import { DotsOrchestratorLoading } from "../lobby/DotsOrchestratorLoading";

import { DotsOnlinePlay } from "./DotsOnlinePlay";
import { DotsOnlineRoomSetup } from "./DotsOnlineRoomSetup/DotsOnlineRoomSetup";
import { DotsOnlineRoomsView } from "./DotsOnlineRoomsView";
import styles from "./DotsOnlineSetup.module.css";
import { InfoModal } from "@/FSD/shared/ui/info-modal/InfoModal";

export type DotsOnlineSetupProps = Readonly<{
  onBackToLobby: () => void;
}>;

/** Online flow: rooms list, room setup, and live play. */
export function DotsOnlineSetup({ onBackToLobby }: DotsOnlineSetupProps): ReactElement | null {
  const t = useTranslations("DotsGame");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { identity, phase, storedDisplayName, setDisplayName, isRegistering } = useOnlineIdentity();
  const { errorMessage, clearError } = useDotsApiErrors();
  const [view, setView] = useState<DotsOnlineView>({ kind: DotsOnlineViewKind.List });
  const didAutoResumeRef = useRef(false);

  useEffect(() => {
    setDotsApiLocaleProvider(() => locale);
  }, [locale]);

  const isAuthenticated = phase === "authenticated" && identity !== null;
  const { data: session } = useSessionQuery(isAuthenticated);
  const activePlayingRoom = session?.activeRoom?.status === "playing" ? session.activeRoom : null;

  const { mutate: createRoom, data: createdRoom, isPending: isCreating, reset: resetCreate } = useCreateRoomMutation();
  const {
    mutate: joinRoom,
    data: joinedRoom,
    error: joinMutationError,
    isPending: isJoining,
    reset: resetJoin,
    variables: joinVariables
  } = useJoinRoomMutation();

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
    if (didAutoResumeRef.current || !activePlayingRoom || !identity || view.kind !== DotsOnlineViewKind.List) {
      return;
    }
    didAutoResumeRef.current = true;
    tryAutoReconnectActiveGame({
      roomId: activePlayingRoom.id,
      identity,
      queryClient,
      joinRoom
    });
  }, [activePlayingRoom, identity, joinRoom, queryClient, view.kind]);

  const portalRoot = useMemo(() => (typeof document !== "undefined" ? document.body : null), []);

  const errorModal = (
    <InfoModal
      isOpen={errorMessage !== null}
      title={t("errorTitle")}
      message={errorMessage ?? ""}
      buttonLabel={t("errorOk")}
      onClose={clearError}
    />
  );

  if (view.kind === DotsOnlineViewKind.List) {
    return (
      <>
        {errorModal}
        <DotsOnlineRoomsView
          identity={identity}
          phase={phase}
          storedDisplayName={storedDisplayName}
          isRegistering={isRegistering}
          isJoining={isJoining}
          joiningRoomId={joinVariables?.roomId ?? null}
          joinMutationError={joinMutationError}
          activePlayingRoom={activePlayingRoom}
          queryClient={queryClient}
          joinRoom={joinRoom}
          setDisplayName={setDisplayName}
          setView={setView}
          onBackToLobby={onBackToLobby}
          onJoinErrorHandled={resetJoin}
        />
      </>
    );
  }
  if (phase !== "authenticated" || !identity) {
    return null;
  }
  if (view.kind === DotsOnlineViewKind.RoomDraft) {
    return (
      <>
        {errorModal}
        <DotsOnlineRoomSetup
          roomId={null}
          userId={identity.userId}
          isCreating={isCreating}
          onBack={() => setView({ kind: DotsOnlineViewKind.List })}
          onGameStarted={(roomId) => setView({ kind: DotsOnlineViewKind.Play, roomId })}
          onLeftRoom={() => setView({ kind: DotsOnlineViewKind.List })}
          onCreateRoom={(draft) => createRoomFromDraft({ draft, identity, createRoom })}
        />
      </>
    );
  }
  if (!activeRoom) {
    return <DotsOrchestratorLoading label={t("connectingToRoom")} />;
  }
  if (view.kind === DotsOnlineViewKind.Room) {
    return (
      <>
        {errorModal}
        <DotsOnlineRoomSetup
          roomId={view.roomId}
          userId={identity.userId}
          isCreating={false}
          onGameStarted={(roomId) => setView({ kind: DotsOnlineViewKind.Play, roomId })}
          onLeftRoom={() => setView({ kind: DotsOnlineViewKind.List })}
          onCreateRoom={(draft) => createRoomFromDraft({ draft, identity, createRoom })}
        />
      </>
    );
  }
  const play = <DotsOnlinePlay room={activeRoom} userId={identity.userId} onExit={() => exitGame({ view, setView })} />;
  return (
    <>
      {errorModal}
      {portalRoot ? createPortal(<div className={styles.playPortalRoot}>{play}</div>, portalRoot) : play}
    </>
  );
}
