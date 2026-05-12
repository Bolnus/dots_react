"use client";

import { useCallback } from "react";

import type { CommitActionRequest, CommitActionResult, EphemeralActionRequest } from "./dotsOnlineApiTypes";
import { applyCommittedAction, applyEphemeralAction } from "./mockServer";

export type UseSendGameActionResult = Readonly<{
  sendCommitted: (request: CommitActionRequest) => Promise<CommitActionResult>;
  sendEphemeral: (request: EphemeralActionRequest) => Promise<void>;
}>;

/** Returns the two action senders for a given room (checksum-validated committed + free-form ephemeral). */
export function useSendGameAction(roomId: string | null): UseSendGameActionResult {
  const sendCommitted = useCallback(
    async (request: CommitActionRequest): Promise<CommitActionResult> => {
      if (!roomId) {
        return {
          status: "rejected",
          reason: "notInGame",
          snapshot: {
            id: "",
            name: "",
            ownerUserId: "",
            isPrivate: false,
            hasPassword: false,
            status: "finished",
            players: [],
            viewers: [],
            config: { rows: 0, cols: 0, cellSizePx: 0 },
            serverState: null,
            presence: null,
            presenceBy: null,
            createdAtMs: 0
          }
        };
      }
      return applyCommittedAction(roomId, request);
    },
    [roomId]
  );

  const sendEphemeral = useCallback(
    async (request: EphemeralActionRequest): Promise<void> => {
      if (!roomId) {
        return;
      }
      await applyEphemeralAction(roomId, request);
    },
    [roomId]
  );

  return { sendCommitted, sendEphemeral };
}
