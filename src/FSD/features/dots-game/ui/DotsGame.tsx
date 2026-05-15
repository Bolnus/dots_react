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
import { DotsGameLobby } from "./DotsGameLobby";
import {
  VIEW_KIND,
  closeJoinModal,
  closeNameModal,
  createRoomFromDraft,
  exitGame,
  openRoom,
  pickActiveRoomId,
  pickOnline,
  requestCreateRoom,
  routeJoinedRoom,
  submitJoinPassword,
  submitName
} from "./DotsGameOrchestratorUtils";
import { DotsHotSeatSetup } from "./DotsHotSeatSetup";
import { DotsOnlineJoinPasswordModal } from "./DotsOnlineJoinPasswordModal";
import { DotsOnlineNamePromptModal } from "./DotsOnlineNamePromptModal";
import { DotsOnlineRoomSetup } from "./DotsOnlineRoomSetup";
import { DotsOnlinePlay } from "./DotsOnlinePlay";
import { DotsOnlineRoomsList } from "./DotsOnlineRoomsList";
import { Icon } from "@/FSD/shared/ui/icon/Icon";

type DotsView =
  | { kind: typeof VIEW_KIND.lobby }
  | { kind: typeof VIEW_KIND.hotSeat }
  | { kind: typeof VIEW_KIND.onlineList }
  | { kind: typeof VIEW_KIND.onlineRoomDraft }
  | { kind: typeof VIEW_KIND.onlineRoom; roomId: string }
  | { kind: typeof VIEW_KIND.onlinePlay; roomId: string };

type PendingJoin = Readonly<{
  roomId: string;
  asViewer: boolean;
  needsPassword: boolean;
}>;

/** Top-level dots-feature orchestrator: routes between lobby / hot-seat / online flows. */
export function DotsGame(): ReactElement | null {
  const t = useTranslations("DotsGame");
  const queryClient = useQueryClient();
  const { identity, setDisplayName } = useOnlineIdentity();
  const [view, setView] = useState<DotsView>({ kind: VIEW_KIND.lobby });
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [pendingJoin, setPendingJoin] = useState<PendingJoin | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const isNameRequired = !identity?.displayName;

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
      setView({ kind: VIEW_KIND.onlineRoom, roomId: createdRoom.id });
      resetCreate();
    }
  }, [createdRoom, resetCreate]);

  useEffect(() => {
    if (joinedRoom) {
      routeJoinedRoom({ room: joinedRoom, setView, setPendingJoin });
      resetJoin();
    }
  }, [joinedRoom, resetJoin]);

  useEffect(() => {
    if (joinMutationError) {
      setJoinError(joinMutationError.message);
      resetJoin();
    }
  }, [joinMutationError, resetJoin]);

  useEffect(() => {
    if (didLeaveSucceed || didLeaveFail) {
      setView({ kind: VIEW_KIND.onlineList });
      resetLeave();
    }
  }, [didLeaveSucceed, didLeaveFail, resetLeave]);

  useEffect(() => {
    if (view.kind === VIEW_KIND.onlineList && !identity?.displayName) {
      setIsNameModalOpen(true);
    }
  }, [view.kind, identity?.displayName]);

  const portalRoot = useMemo(() => (typeof document !== "undefined" ? document.body : null), []);

  if (view.kind === VIEW_KIND.lobby) {
    return (
      <div className={styles.orchestrator}>
        <DotsGameLobby
          onPickOnline={() => pickOnline({ displayName: identity?.displayName, setIsNameModalOpen, setView })}
          onPickHotSeat={() => setView({ kind: VIEW_KIND.hotSeat })}
        />
      </div>
    );
  }
  if (view.kind === VIEW_KIND.hotSeat) {
    return (
      <div className={styles.orchestrator}>
        <DotsHotSeatSetup onBack={() => setView({ kind: VIEW_KIND.lobby })} />
      </div>
    );
  }
  if (view.kind === VIEW_KIND.onlineList) {
    return (
      <div className={styles.orchestrator}>
        <DotsOnlineRoomsList
          displayName={identity?.displayName ?? ""}
          isJoining={isJoining}
          joiningRoomId={joinVariables?.roomId ?? null}
          onBack={() => setView({ kind: VIEW_KIND.lobby })}
          onCreateRoom={() => requestCreateRoom({ displayName: identity?.displayName, setIsNameModalOpen, setView })}
          onChangeName={() => setIsNameModalOpen(true)}
          onOpenRoom={(roomId) =>
            openRoom({
              roomId,
              identity,
              queryClient,
              joinRoom,
              setIsNameModalOpen,
              setPendingJoin,
              setJoinError
            })
          }
        />
        {identity ? (
          <DotsOnlineNamePromptModal
            isOpen={isNameModalOpen}
            initialName={identity.displayName ?? ""}
            isRequired={isNameRequired}
            onSubmit={(name) => submitName({ name, setDisplayName, setIsNameModalOpen })}
            onClose={() => closeNameModal({ isRequired: isNameRequired, setIsNameModalOpen })}
          />
        ) : null}
        {pendingJoin ? (
          <DotsOnlineJoinPasswordModal
            isOpen
            errorText={joinError}
            isSubmitting={isJoining}
            onSubmit={(password) =>
              submitJoinPassword({ password, pending: pendingJoin, identity, joinRoom, setJoinError })
            }
            onClose={() => closeJoinModal({ setPendingJoin, setJoinError })}
          />
        ) : null}
      </div>
    );
  }
  if (!identity?.displayName) {
    return null;
  }
  if (view.kind === VIEW_KIND.onlineRoomDraft) {
    return (
      <div className={styles.orchestrator}>
        <DotsOnlineRoomSetup
          roomId={null}
          userId={identity.userId}
          isCreating={isCreating}
          onBack={() => setView({ kind: VIEW_KIND.onlineList })}
          onGameStarted={(roomId) => setView({ kind: VIEW_KIND.onlinePlay, roomId })}
          onLeftRoom={() => setView({ kind: VIEW_KIND.onlineList })}
          onCreateRoom={(draft) => createRoomFromDraft({ draft, identity, createRoom })}
        />
      </div>
    );
  }
  if (!activeRoom) {
    return (
      <div className={styles.orchestrator}>
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
          <Icon iconName="fetching" size="lg" title={t("connectingToRoom")} />
          <span>{t("connectingToRoom")}</span>
        </div>
      </div>
    );
  }
  if (view.kind === VIEW_KIND.onlineRoom) {
    return (
      <div className={styles.orchestrator}>
        <DotsOnlineRoomSetup
          roomId={view.roomId}
          userId={identity.userId}
          isCreating={false}
          onBack={() => setView({ kind: VIEW_KIND.onlineList })}
          onGameStarted={(roomId) => setView({ kind: VIEW_KIND.onlinePlay, roomId })}
          onLeftRoom={() => setView({ kind: VIEW_KIND.onlineList })}
          onCreateRoom={(draft) => createRoomFromDraft({ draft, identity, createRoom })}
        />
      </div>
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
