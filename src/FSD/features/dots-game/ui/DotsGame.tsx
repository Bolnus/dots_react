"use client";

import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";

import type { DotsRoomSummary } from "../api/dotsOnlineApiTypes";
import { DOTS_QUERY_KEYS } from "../api/queryKeys";
import { useCreateRoomMutation } from "../api/useCreateRoomMutation";
import { useJoinRoomMutation } from "../api/useJoinRoomMutation";
import { useLeaveRoomMutation } from "../api/useLeaveRoomMutation";
import { useRoomQuery } from "../api/useRoomQuery";
import { useOnlineIdentity } from "../model/useOnlineIdentity";

import styles from "./DotsGame.module.css";
import { DotsGameLobby } from "./DotsGameLobby";
import { DotsHotSeatSetup } from "./DotsHotSeatSetup";
import { DotsOnlineJoinPasswordModal } from "./DotsOnlineJoinPasswordModal";
import { DotsOnlineNamePromptModal } from "./DotsOnlineNamePromptModal";
import type { CreateRoomDraft } from "./DotsOnlineRoomSetup";
import { DotsOnlineRoomSetup } from "./DotsOnlineRoomSetup";
import { DotsOnlinePlay } from "./DotsOnlinePlay";
import { DotsOnlineRoomsList } from "./DotsOnlineRoomsList";

type DotsView =
  | { kind: "lobby" }
  | { kind: "hotseat" }
  | { kind: "online-list" }
  | { kind: "online-room-draft" }
  | { kind: "online-room"; roomId: string }
  | { kind: "online-play"; roomId: string };

type PendingJoin = Readonly<{
  roomId: string;
  asViewer: boolean;
  needsPassword: boolean;
}>;

/** Looks up a room summary from the cached rooms list (no network round-trip). */
function findRoomSummary(cached: DotsRoomSummary[] | undefined, roomId: string): DotsRoomSummary | null {
  if (!cached) {
    return null;
  }
  return cached.find((entry) => entry.id === roomId) ?? null;
}

/** Top-level dots-feature orchestrator: routes between lobby / hot-seat / online flows. */
export function DotsGame(): ReactElement | null {
  const queryClient = useQueryClient();
  const { identity, setDisplayName } = useOnlineIdentity();
  const [view, setView] = useState<DotsView>({ kind: "lobby" });
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isNameRequired, setIsNameRequired] = useState(false);
  const [pendingJoin, setPendingJoin] = useState<PendingJoin | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const createMutation = useCreateRoomMutation();
  const joinMutation = useJoinRoomMutation();
  const leaveMutation = useLeaveRoomMutation();
  const activeRoomId = view.kind === "online-room" || view.kind === "online-play" ? view.roomId : null;
  const roomQuery = useRoomQuery(activeRoomId);

  const goToLobby = useCallback((): void => setView({ kind: "lobby" }), []);
  const goToHotSeat = useCallback((): void => setView({ kind: "hotseat" }), []);
  const goToOnlineList = useCallback((): void => setView({ kind: "online-list" }), []);
  const goToDraft = useCallback((): void => setView({ kind: "online-room-draft" }), []);

  const onPickOnline = useCallback((): void => {
    if (!identity?.displayName) {
      setIsNameRequired(true);
      setIsNameModalOpen(true);
    }
    setView({ kind: "online-list" });
  }, [identity?.displayName]);

  const onChangeName = useCallback((): void => {
    setIsNameRequired(false);
    setIsNameModalOpen(true);
  }, []);

  const onSubmitName = useCallback(
    (name: string): void => {
      setDisplayName(name);
      setIsNameModalOpen(false);
      setIsNameRequired(false);
    },
    [setDisplayName]
  );

  const onCloseNameModal = useCallback((): void => {
    if (isNameRequired) {
      return;
    }
    setIsNameModalOpen(false);
  }, [isNameRequired]);

  const performJoin = useCallback(
    (pending: PendingJoin, password: string | undefined): void => {
      if (!identity?.displayName) {
        return;
      }
      setJoinError(null);
      joinMutation.mutate(
        {
          roomId: pending.roomId,
          request: {
            userId: identity.userId,
            displayName: identity.displayName,
            asViewer: pending.asViewer,
            password
          }
        },
        {
          onSuccess: (room) => {
            setPendingJoin(null);
            if (room.status === "waiting") {
              setView({ kind: "online-room", roomId: room.id });
            } else {
              setView({ kind: "online-play", roomId: room.id });
            }
          },
          onError: (error) => {
            setJoinError(error.message);
          }
        }
      );
    },
    [identity, joinMutation]
  );

  const onOpenRoom = useCallback(
    (roomId: string): void => {
      if (!identity?.displayName) {
        setIsNameRequired(true);
        setIsNameModalOpen(true);
        return;
      }
      const cached = queryClient.getQueryData<DotsRoomSummary[]>(DOTS_QUERY_KEYS.roomsList);
      const summary = findRoomSummary(cached, roomId);
      const isProtected = summary?.hasPassword === true;
      const isPlaying = summary?.status === "playing";
      const isFinished = summary?.status === "finished";
      const asViewer = Boolean(isPlaying) || Boolean(isFinished);
      const pending: PendingJoin = { roomId, asViewer, needsPassword: isProtected };
      setJoinError(null);
      if (isProtected) {
        setPendingJoin(pending);
        return;
      }
      performJoin(pending, undefined);
    },
    [identity?.displayName, queryClient, performJoin]
  );

  const onCreateRoom = useCallback(
    (draft: CreateRoomDraft): void => {
      if (!identity?.displayName) {
        return;
      }
      createMutation.mutate(
        {
          name: `${identity.displayName}'s room`,
          ownerUserId: identity.userId,
          ownerName: identity.displayName,
          config: draft.config,
          isPrivate: draft.isPrivate,
          password: draft.password
        },
        {
          onSuccess: (room) => {
            setView({ kind: "online-room", roomId: room.id });
          }
        }
      );
    },
    [identity, createMutation]
  );

  const onLeaveRoom = useCallback((): void => {
    goToOnlineList();
  }, [goToOnlineList]);

  const onExitGame = useCallback((): void => {
    if (view.kind !== "online-play" || !identity) {
      goToOnlineList();
      return;
    }
    leaveMutation.mutate(
      { roomId: view.roomId, request: { userId: identity.userId } },
      { onSettled: () => goToOnlineList() }
    );
  }, [view, identity, leaveMutation, goToOnlineList]);

  const onGameStarted = useCallback((roomId: string): void => {
    setView({ kind: "online-play", roomId });
  }, []);

  useEffect(() => {
    if (view.kind === "online-list" && !identity?.displayName) {
      setIsNameRequired(true);
      setIsNameModalOpen(true);
    }
  }, [view.kind, identity?.displayName]);

  const onCloseJoinModal = useCallback((): void => {
    setPendingJoin(null);
    setJoinError(null);
  }, []);

  const onSubmitJoinPassword = useCallback(
    (password: string): void => {
      if (pendingJoin) {
        performJoin(pendingJoin, password);
      }
    },
    [pendingJoin, performJoin]
  );

  const portalRoot = useMemo(() => (typeof document !== "undefined" ? document.body : null), []);

  if (view.kind === "lobby") {
    return (
      <div className={styles.orchestrator}>
        <DotsGameLobby onPickOnline={onPickOnline} onPickHotSeat={goToHotSeat} />
      </div>
    );
  }

  if (view.kind === "hotseat") {
    return (
      <div className={styles.orchestrator}>
        <DotsHotSeatSetup onBack={goToLobby} />
      </div>
    );
  }

  if (view.kind === "online-list") {
    const nameModal = identity ? (
      <DotsOnlineNamePromptModal
        isOpen={isNameModalOpen}
        initialName={identity.displayName ?? ""}
        isRequired={isNameRequired}
        onSubmit={onSubmitName}
        onClose={onCloseNameModal}
      />
    ) : null;
    const joinModal = pendingJoin ? (
      <DotsOnlineJoinPasswordModal
        isOpen
        errorText={joinError}
        isSubmitting={joinMutation.isPending}
        onSubmit={onSubmitJoinPassword}
        onClose={onCloseJoinModal}
      />
    ) : null;
    return (
      <div className={styles.orchestrator}>
        <DotsOnlineRoomsList
          displayName={identity?.displayName ?? ""}
          onBack={goToLobby}
          onCreateRoom={() => {
            if (!identity?.displayName) {
              setIsNameRequired(true);
              setIsNameModalOpen(true);
              return;
            }
            goToDraft();
          }}
          onChangeName={onChangeName}
          onOpenRoom={onOpenRoom}
        />
        {nameModal}
        {joinModal}
      </div>
    );
  }

  if (view.kind === "online-room-draft") {
    if (!identity?.displayName) {
      return null;
    }
    return (
      <div className={styles.orchestrator}>
        <DotsOnlineRoomSetup
          roomId={null}
          userId={identity.userId}
          onBack={goToOnlineList}
          onGameStarted={onGameStarted}
          onLeftRoom={onLeaveRoom}
          onCreateRoom={onCreateRoom}
        />
      </div>
    );
  }

  if (view.kind === "online-room") {
    if (!identity?.displayName) {
      return null;
    }
    return (
      <div className={styles.orchestrator}>
        <DotsOnlineRoomSetup
          roomId={view.roomId}
          userId={identity.userId}
          onBack={goToOnlineList}
          onGameStarted={onGameStarted}
          onLeftRoom={onLeaveRoom}
          onCreateRoom={onCreateRoom}
        />
      </div>
    );
  }

  if (view.kind === "online-play") {
    const room = roomQuery.data;
    if (!identity || !room) {
      return <div className={styles.orchestrator} />;
    }
    const play = <DotsOnlinePlay room={room} userId={identity.userId} onExit={onExitGame} />;
    if (!portalRoot) {
      return play;
    }
    return createPortal(<div className={styles.playPortalRoot}>{play}</div>, portalRoot);
  }

  return null;
}
