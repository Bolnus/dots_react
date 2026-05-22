"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";

import { useLeaveRoomMutation } from "../../../api/useLeaveRoomMutation";
import { useRoomLive } from "../../../api/useRoomLive";
import { useStartGameMutation } from "../../../api/useStartGameMutation";
import { useUpdateRoomMutation } from "../../../api/useUpdateRoomMutation";
import { defaultDotsConfig } from "../../../model/logic";

import { DraftRoomSetupBody } from "./DraftRoomSetupBody";
import styles from "./DotsOnlineRoomSetup.module.css";
import { InRoomSetupBody } from "./InRoomSetupBody";
import { requestStartGame, submitDraft } from "./roomSetupUtils";
import type { DotsOnlineRoomSetupProps, DraftFormState } from "./types";

/** Online configuration view: in draft mode shows "Create room"; in in-room mode shows roster + "Start game". */
export function DotsOnlineRoomSetup(props: DotsOnlineRoomSetupProps): ReactElement {
  const defaults = useMemo(() => defaultDotsConfig(), []);
  const [draft, setDraft] = useState<DraftFormState>(() => ({
    name: "",
    rows: defaults.rows,
    cols: defaults.cols,
    password: ""
  }));
  const [startError, setStartError] = useState<string | null>(null);

  const { roomId, userId, isCreating = false, onBack, onGameStarted, onLeftRoom, onCreateRoom } = props;
  const live = useRoomLive(roomId);
  const { room } = live;

  const { mutate: updateRoom } = useUpdateRoomMutation();
  const { mutate: startGame, error: startMutationError, reset: resetStart } = useStartGameMutation();
  const { mutate: leaveRoom, isSuccess: didLeaveSucceed, reset: resetLeave } = useLeaveRoomMutation();

  useEffect(() => {
    if (roomId && room && room.status === "playing") {
      onGameStarted(room.id);
    }
  }, [roomId, room, onGameStarted]);

  useEffect(() => {
    if (startMutationError) {
      setStartError(startMutationError.message);
      resetStart();
    }
  }, [startMutationError, resetStart]);

  useEffect(() => {
    if (didLeaveSucceed) {
      onLeftRoom();
      resetLeave();
    }
  }, [didLeaveSucceed, onLeftRoom, resetLeave]);

  if (!roomId) {
    return (
      <DraftRoomSetupBody
        draft={draft}
        setDraft={setDraft}
        defaults={defaults}
        isCreating={isCreating}
        onBack={onBack}
        onCreate={() => submitDraft({ draft, defaults, onCreateRoom })}
      />
    );
  }

  if (!room) {
    return <div className={styles.setup}>...</div>;
  }

  return (
    <InRoomSetupBody
      room={room}
      userId={userId}
      defaults={defaults}
      onBack={onBack}
      onStart={() => requestStartGame({ roomId: room.id, userId, setStartError, startGame })}
      onPatch={(patch) => updateRoom({ roomId: room.id, request: { byUserId: userId, ...patch } })}
      onKick={(kickUserId) => updateRoom({ roomId: room.id, request: { byUserId: userId, kickUserId } })}
      onLeave={() => leaveRoom({ roomId: room.id, request: { userId } })}
      startError={startError}
    />
  );
}
