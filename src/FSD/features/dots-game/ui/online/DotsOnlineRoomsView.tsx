"use client";

import { useEffect, useState, type ReactElement } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import type { JoinRoomRequest } from "../../api/dotsOnlineApiTypes";
import type { DotsOnlineIdentity } from "../../model/useOnlineIdentity";
import {
  closeJoinModal,
  closeNameModal,
  openRoom,
  requestCreateRoom,
  submitJoinPassword,
  submitName
} from "../../model/orchestratorUtils";
import type { DotsOnlineView, PendingJoin } from "../../model/orchestratorTypes";
import { DotsOnlineRoomsList } from "./DotsOnlineRoomsList";
import { PromptModal } from "@/FSD/shared/ui/prompt-modal/PromptModal";

export type DotsOnlineRoomsViewProps = Readonly<{
  identity: DotsOnlineIdentity | null;
  isJoining: boolean;
  joiningRoomId: string | null;
  joinMutationError: Error | null;
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
  isJoining,
  joiningRoomId,
  joinMutationError,
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

  const isNameRequired = !identity?.displayName;

  useEffect(() => {
    if (!identity?.displayName) {
      setIsNameModalOpen(true);
    }
  }, [identity?.displayName]);

  useEffect(() => {
    if (joinMutationError) {
      setJoinError(joinMutationError.message);
      onJoinErrorHandled();
    }
  }, [joinMutationError, onJoinErrorHandled]);

  return (
    <>
      <DotsOnlineRoomsList
        displayName={identity?.displayName ?? ""}
        isJoining={isJoining}
        joiningRoomId={joiningRoomId}
        onBack={onBackToLobby}
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
        <PromptModal
          isOpen={isNameModalOpen}
          title={t("enterYourName")}
          fieldLabel={t("namePlaceholder")}
          submitLabel={t("submitName")}
          placeholder={t("namePlaceholder")}
          initialValue={identity.displayName ?? ""}
          isClearable
          isDismissable={!isNameRequired}
          requireNonEmpty
          onSubmit={(name) => submitName({ name, setDisplayName, setIsNameModalOpen })}
          onClose={() => closeNameModal({ isRequired: isNameRequired, setIsNameModalOpen })}
        />
      ) : null}
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
