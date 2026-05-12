"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import type { DotsRoomDetail, PatchRoomRequest } from "./dotsOnlineApiTypes";
import { patchRoom } from "./mockServer";
import { DOTS_QUERY_KEYS } from "./queryKeys";

type UpdateRoomArgs = Readonly<{ roomId: string; request: PatchRoomRequest }>;

/** Mutation hook that patches a room as its owner; broadcasts via the live channel. */
export function useUpdateRoomMutation(): UseMutationResult<DotsRoomDetail, Error, UpdateRoomArgs> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, request }: UpdateRoomArgs) => patchRoom(roomId, request),
    onSuccess: (room) => {
      queryClient.setQueryData(DOTS_QUERY_KEYS.room(room.id), room);
      void queryClient.invalidateQueries({ queryKey: DOTS_QUERY_KEYS.roomsList });
    }
  });
}
