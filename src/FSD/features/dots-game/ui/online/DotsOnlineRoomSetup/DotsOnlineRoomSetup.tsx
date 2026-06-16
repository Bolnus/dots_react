"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";

import type { LeaveRoomRequest } from "../../../api/dotsOnlineApiTypes";
import { useAddAiMutation } from "../../../api/useAddAiMutation";
import { useLeaveRoomMutation } from "../../../api/useLeaveRoomMutation";
import { useRoomLive } from "../../../api/useRoomLive";
import { useStartGameMutation } from "../../../api/useStartGameMutation";
import { useUpdateRoomMutation } from "../../../api/useUpdateRoomMutation";
import { defaultDotsConfig } from "../../../model/logic";

import { DraftRoomSetupBody } from "./DraftRoomSetupBody";
import { InRoomSetupBody } from "./InRoomSetupBody";
import { submitDraft } from "./roomSetupUtils";
import type { DotsOnlineRoomSetupProps, DraftFormState } from "./types";
import { SectionFetching } from "@/FSD/shared/ui/section-fetching/SectionFetching";

/** Leaves the waiting room or navigates back when still in draft mode. */
function requestLeave({
  isLeaving,
  roomId,
  userId,
  onBack,
  leaveRoom
}: Readonly<{
  isLeaving: boolean;
  roomId: string | null;
  userId: string;
  onBack?: () => void;
  leaveRoom: (args: Readonly<{ roomId: string; request: LeaveRoomRequest }>) => void;
}>): void {
  if (isLeaving) {
    return;
  }
  if (!roomId) {
    onBack?.();
    return;
  }
  leaveRoom({ roomId, request: { userId } });
}

/** Online configuration view: in draft mode shows "Create room"; in in-room mode shows roster + "Start game". */
export function DotsOnlineRoomSetup(props: DotsOnlineRoomSetupProps): ReactElement {
  const t = useTranslations("DotsGame");
  const defaults = useMemo(() => defaultDotsConfig(), []);
  const [draft, setDraft] = useState<DraftFormState>(() => ({
    name: "",
    rows: defaults.rows,
    cols: defaults.cols,
    password: ""
  }));

  const { roomId, userId, isCreating = false, onBack, onGameStarted, onLeftRoom, onCreateRoom } = props;
  const live = useRoomLive(roomId);
  const { room } = live;

  const { mutate: updateRoom, isPending: isPatching } = useUpdateRoomMutation();
  const { mutate: addAi, isPending: isAddingAi } = useAddAiMutation();
  const {
    mutate: startGame,
    error: startMutationError,
    reset: resetStart,
    isPending: isStarting
  } = useStartGameMutation();
  const {
    mutate: leaveRoom,
    isPending: isLeaving,
    isSuccess: didLeaveSucceed,
    isError: didLeaveFail,
    reset: resetLeave
  } = useLeaveRoomMutation();

  useEffect(() => {
    if (roomId && room && room.status === "playing") {
      onGameStarted(room.id);
    }
  }, [roomId, room, onGameStarted]);

  useEffect(() => {
    if (startMutationError) {
      resetStart();
    }
  }, [startMutationError, resetStart]);

  useEffect(() => {
    if (didLeaveSucceed) {
      onLeftRoom();
      resetLeave();
    }
  }, [didLeaveSucceed, onLeftRoom, resetLeave]);

  useEffect(() => {
    if (didLeaveFail) {
      resetLeave();
    }
  }, [didLeaveFail, resetLeave]);

  if (!roomId) {
    return (
      <DraftRoomSetupBody
        draft={draft}
        setDraft={setDraft}
        defaults={defaults}
        isCreating={isCreating}
        onBack={() => onBack?.()}
        onCreate={() => submitDraft({ draft, defaults, onCreateRoom })}
      />
    );
  }

  if (!room) {
    return <SectionFetching label={t("connectingToRoom")} />;
  }

  return (
    <InRoomSetupBody
      room={room}
      userId={userId}
      defaults={defaults}
      isLeaving={isLeaving}
      isStarting={isStarting}
      isPatching={isPatching}
      isAddingAi={isAddingAi}
      onBack={() => requestLeave({ isLeaving, roomId, userId, onBack, leaveRoom })}
      onStart={() => startGame({ roomId: room.id, request: { byUserId: userId } })}
      onPatch={(patch) => updateRoom({ roomId: room.id, request: { byUserId: userId, ...patch } })}
      onKick={(kickUserId) => updateRoom({ roomId: room.id, request: { byUserId: userId, kickUserId } })}
      onAddAi={() => addAi(room.id)}
    />
  );
}
