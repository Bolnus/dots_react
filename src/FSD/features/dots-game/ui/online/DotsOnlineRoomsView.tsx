"use client";

import { useEffect, useState, type ReactElement } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import type { DotsSessionActiveRoom, JoinRoomRequest } from "../../api/dotsOnlineApiTypes";
import type { DotsOnlineIdentity, IdentityPhase } from "../../model/onlineIdentityTypes";
import {
  closeJoinModal,
  closeNameModal,
  openRoom,
  reconnectActiveGame,
  requestCreateRoom,
  submitJoinPassword,
  submitName
} from "../../model/orchestratorUtils";
import type { DotsOnlineView, PendingJoin } from "../../model/orchestratorTypes";
import { DotsOnlineRoomsList } from "./DotsOnlineRoomsList";
import { PromptModal } from "@/FSD/shared/ui/prompt-modal/PromptModal";

type HandleNameSubmitArgs = Readonly<{
  name: string;
  setDisplayName: (name: string) => Promise<void>;
  setIsNameModalOpen: (open: boolean) => void;
  setNameError: (error: string | null) => void;
}>;

/** Submits the name modal value and updates inline error state on failure. */
async function handleNameSubmit({
  name,
  setDisplayName,
  setIsNameModalOpen,
  setNameError
}: HandleNameSubmitArgs): Promise<void> {
  setNameError(null);
  const errorMessage = await submitName({ name, setDisplayName, setIsNameModalOpen });
  if (errorMessage) {
    setNameError(errorMessage);
  }
}

/** Rejoins the user's in-progress game from the rooms list. */
function handleReconnectToActiveGame({
  identity,
  activePlayingRoom,
  queryClient,
  joinRoom,
  setPendingJoin,
  setJoinError
}: Readonly<{
  identity: DotsOnlineIdentity | null;
  activePlayingRoom: DotsSessionActiveRoom | null;
  queryClient: QueryClient;
  joinRoom: (args: Readonly<{ roomId: string; request: JoinRoomRequest }>) => void;
  setPendingJoin: (value: PendingJoin | null) => void;
  setJoinError: (value: string | null) => void;
}>): void {
  if (!identity || !activePlayingRoom) {
    return;
  }
  reconnectActiveGame({
    roomId: activePlayingRoom.id,
    identity,
    queryClient,
    joinRoom,
    setPendingJoin,
    setJoinError
  });
}

export type DotsOnlineRoomsViewProps = Readonly<{
  identity: DotsOnlineIdentity | null;
  phase: IdentityPhase;
  storedDisplayName: string | null;
  isRegistering: boolean;
  isJoining: boolean;
  joiningRoomId: string | null;
  joinMutationError: Error | null;
  activePlayingRoom: DotsSessionActiveRoom | null;
  queryClient: QueryClient;
  joinRoom: (args: Readonly<{ roomId: string; request: JoinRoomRequest }>) => void;
  setDisplayName: (name: string) => Promise<void>;
  setView: (view: DotsOnlineView) => void;
  onBackToLobby: () => void;
  onJoinErrorHandled: () => void;
}>;

/** Online rooms list with name/join modals; owns list-only UI state. */
export function DotsOnlineRoomsView({
  identity,
  phase,
  storedDisplayName,
  isRegistering,
  isJoining,
  joiningRoomId,
  joinMutationError,
  activePlayingRoom,
  queryClient,
  joinRoom,
  setDisplayName,
  setView,
  onBackToLobby,
  onJoinErrorHandled
}: DotsOnlineRoomsViewProps): ReactElement {
  const t = useTranslations("DotsGame");
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [pendingJoin, setPendingJoin] = useState<PendingJoin | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const isNameRequired = phase === "resolving" || phase === "needs_name";
  const showNameModal = isNameRequired || isNameModalOpen;
  const isResolving = phase === "resolving";
  const isListDisabled = isJoining || isResolving;

  useEffect(() => {
    if (joinMutationError) {
      setJoinError(joinMutationError.message);
      onJoinErrorHandled();
    }
  }, [joinMutationError, onJoinErrorHandled]);

  return (
    <>
      <DotsOnlineRoomsList
        displayName={identity?.displayName ?? storedDisplayName ?? ""}
        activePlayingRoom={activePlayingRoom}
        isJoining={isListDisabled}
        joiningRoomId={joiningRoomId}
        onBack={onBackToLobby}
        onCreateRoom={() => requestCreateRoom({ displayName: identity?.displayName, setIsNameModalOpen, setView })}
        onChangeName={() => setIsNameModalOpen(true)}
        onReconnect={() =>
          handleReconnectToActiveGame({
            identity,
            activePlayingRoom,
            queryClient,
            joinRoom,
            setPendingJoin,
            setJoinError
          })
        }
        onOpenRoom={(roomId) =>
          openRoom({
            roomId,
            identity,
            activeRoom: activePlayingRoom,
            queryClient,
            joinRoom,
            setIsNameModalOpen,
            setPendingJoin,
            setJoinError
          })
        }
      />
      <PromptModal
        isOpen={showNameModal}
        title={t("enterYourName")}
        fieldLabel={t("namePlaceholder")}
        submitLabel={t("submitName")}
        placeholder={t("namePlaceholder")}
        initialValue={identity?.displayName ?? storedDisplayName ?? ""}
        isClearable
        isDismissable
        requireNonEmpty
        isSubmitting={isResolving || isRegistering}
        errorText={nameError}
        onSubmit={(name) => void handleNameSubmit({ name, setDisplayName, setIsNameModalOpen, setNameError })}
        onClose={() => closeNameModal({ isRequired: isNameRequired, setIsNameModalOpen, onBackToLobby })}
      />
      {pendingJoin ? (
        <PromptModal
          isOpen
          title={t("passwordPromptLabel")}
          fieldLabel={t("password")}
          submitLabel={t("submitName")}
          isPassword
          isClearable
          errorText={joinError}
          isSubmitting={isJoining}
          onSubmit={(password) =>
            submitJoinPassword({ password, pending: pendingJoin, identity, joinRoom, setJoinError })
          }
          onClose={() => closeJoinModal({ setPendingJoin, setJoinError })}
        />
      ) : null}
    </>
  );
}
