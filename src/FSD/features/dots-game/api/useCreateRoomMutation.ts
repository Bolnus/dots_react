"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import type { CreateRoomRequest, DotsRoomDetail } from "./dotsOnlineApiTypes";
import { createRoom } from "./mockServer";
import { DOTS_QUERY_KEYS } from "./queryKeys";

/** Mutation hook that creates a new room and invalidates the rooms list. */
export function useCreateRoomMutation(): UseMutationResult<DotsRoomDetail, Error, CreateRoomRequest> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateRoomRequest) => createRoom(request),
    onSuccess: (room) => {
      queryClient.setQueryData(DOTS_QUERY_KEYS.room(room.id), room);
      void queryClient.invalidateQueries({ queryKey: DOTS_QUERY_KEYS.roomsList });
    }
  });
}
