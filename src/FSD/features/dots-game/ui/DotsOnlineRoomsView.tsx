"use client";

import { useEffect, useState, type ReactElement } from "react";
import type { QueryClient } from "@tanstack/react-query";

import type { JoinRoomRequest } from "../api/dotsOnlineApiTypes";
import type { DotsOnlineIdentity } from "../model/useOnlineIdentity";

import {
  closeJoinModal,
  closeNameModal,
  openRoom,
  requestCreateRoom,
  submitJoinPassword,
  submitName
} from "./DotsGameOrchestratorUtils";
import { DotsViewKind, type DotsView, type PendingJoin } from "./DotsGameOrchestratorTypes";
import { DotsOnlineJoinPasswordModal } from "./DotsOnlineJoinPasswordModal";
import { DotsOnlineNamePromptModal } from "./DotsOnlineNamePromptModal";
import { DotsOnlineRoomsList } from "./DotsOnlineRoomsList";

export type DotsOnlineRoomsViewProps = Readonly<{
  identity: DotsOnlineIdentity | null;
  isJoining: boolean;
  joiningRoomId: string | null;
  joinMutationError: Error | null;
  queryClient: QueryClient;
  joinRoom: (args: Readonly<{ roomId: string; request: JoinRoomRequest }>) => void;
  setDisplayName: (name: string) => void;
  setView: (view: DotsView) => void;
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
  onJoinErrorHandled
}: DotsOnlineRoomsViewProps): ReactElement {
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
        onBack={() => setView({ kind: DotsViewKind.Lobby })}
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
    </>
  );
}
