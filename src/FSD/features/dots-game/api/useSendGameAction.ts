"use client";

import { useCallback } from "react";

import type {
  CommitActionRequest,
  CommitActionResult,
  EphemeralActionRequest,
  UseSendGameActionResult
} from "./dotsOnlineApiTypes";
import { applyCommittedAction } from "./dotsApi";
import { sendDotsPresence } from "./dotsRealtime";

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
            config: { rows: 0, cols: 0 },
            serverState: null,
            presence: null,
            presenceBy: null,
            lockedPlayers: { player0: null, player1: null },
            connectedUserIds: [],
            createdAtMs: 0
          }
        };
      }
      return applyCommittedAction(roomId, request);
    },
    [roomId]
  );

  const sendEphemeral = useCallback(
    (request: EphemeralActionRequest): Promise<void> => {
      if (!roomId) {
        return Promise.resolve();
      }
      sendDotsPresence(roomId, request.patch);
      return Promise.resolve();
    },
    [roomId]
  );

  return { sendCommitted, sendEphemeral };
}
