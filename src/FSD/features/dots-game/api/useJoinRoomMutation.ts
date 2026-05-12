"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import type { DotsRoomDetail, JoinRoomRequest } from "./dotsOnlineApiTypes";
import { joinRoom } from "./mockServer";
import { DOTS_QUERY_KEYS } from "./queryKeys";

type JoinRoomArgs = Readonly<{ roomId: string; request: JoinRoomRequest }>;

/** Mutation hook that joins a room as player (or viewer when the slot is full). */
export function useJoinRoomMutation(): UseMutationResult<DotsRoomDetail, Error, JoinRoomArgs> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, request }: JoinRoomArgs) => joinRoom(roomId, request),
    onSuccess: (room) => {
      queryClient.setQueryData(DOTS_QUERY_KEYS.room(room.id), room);
      void queryClient.invalidateQueries({ queryKey: DOTS_QUERY_KEYS.roomsList });
    }
  });
}
