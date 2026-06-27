"use client";

import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { setDotsApiLocaleProvider } from "../../api/dotsHttpClient";
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

import { DotsApiErrorProvider } from "./DotsApiErrorProvider";
import { DotsOnlinePlay } from "./DotsOnlinePlay";
import { DotsOnlineRoomSetup } from "./DotsOnlineRoomSetup/DotsOnlineRoomSetup";
import { DotsOnlineRoomsView } from "./DotsOnlineRoomsView";
import styles from "./DotsOnlineSetup.module.css";
import { SectionFetching } from "@/FSD/shared/ui/section-fetching/SectionFetching";

export type DotsOnlineSetupProps = Readonly<{
  onBackToLobby: () => void;
}>;

/** Online flow: rooms list, room setup, and live play. */
export function DotsOnlineSetup({ onBackToLobby }: DotsOnlineSetupProps): ReactElement | null {
  const t = useTranslations("DotsGame");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { identity, phase, storedDisplayName, setDisplayName, isRegistering } = useOnlineIdentity();
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

  const activeRoomId = pickActiveRoomId(view);
  const { data: activeRoom, isLoading: isRoomLoading, isError: isRoomError } = useRoomQuery(activeRoomId);

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

  const roomLoadFailure = (
    <div className={styles.loadError}>
      <p>{t("loadRoomFailed")}</p>
      <button type="button" className={styles.loadErrorBack} onClick={() => setView({ kind: DotsOnlineViewKind.List })}>
        {t("back")}
      </button>
    </div>
  );

  let content: ReactElement | null;

  if (view.kind === DotsOnlineViewKind.List) {
    content = (
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
    );
  } else if (phase !== "authenticated" || !identity) {
    content = null;
  } else if (view.kind === DotsOnlineViewKind.RoomDraft) {
    content = (
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
  } else if (isRoomLoading) {
    content = <SectionFetching label={t("connectingToRoom")} />;
  } else if (isRoomError || !activeRoom) {
    content = roomLoadFailure;
  } else if (view.kind === DotsOnlineViewKind.Room) {
    content = (
      <DotsOnlineRoomSetup
        roomId={view.roomId}
        userId={identity.userId}
        isCreating={false}
        onGameStarted={(roomId) => setView({ kind: DotsOnlineViewKind.Play, roomId })}
        onLeftRoom={() => setView({ kind: DotsOnlineViewKind.List })}
        onCreateRoom={(draft) => createRoomFromDraft({ draft, identity, createRoom })}
      />
    );
  } else {
    const play = (
      <DotsOnlinePlay roomId={view.roomId} userId={identity.userId} onExit={() => exitGame({ view, setView })} />
    );
    content = portalRoot ? createPortal(<div className={styles.playPortalRoot}>{play}</div>, portalRoot) : play;
  }

  return <DotsApiErrorProvider>{content}</DotsApiErrorProvider>;
}
