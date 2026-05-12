"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import type { LeaveRoomRequest } from "./dotsOnlineApiTypes";
import { leaveRoom } from "./mockServer";
import { DOTS_QUERY_KEYS } from "./queryKeys";

type LeaveRoomArgs = Readonly<{ roomId: string; request: LeaveRoomRequest }>;

/** Mutation hook that leaves a room; rooms list is invalidated on completion. */
export function useLeaveRoomMutation(): UseMutationResult<void, Error, LeaveRoomArgs> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, request }: LeaveRoomArgs) => leaveRoom(roomId, request),
    onSuccess: (_data, { roomId }) => {
      queryClient.removeQueries({ queryKey: DOTS_QUERY_KEYS.room(roomId) });
      void queryClient.invalidateQueries({ queryKey: DOTS_QUERY_KEYS.roomsList });
    }
  });
}
