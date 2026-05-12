"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import type { DotsRoomDetail, StartGameRequest } from "./dotsOnlineApiTypes";
import { startGame } from "./mockServer";
import { DOTS_QUERY_KEYS } from "./queryKeys";

type StartGameArgs = Readonly<{ roomId: string; request: StartGameRequest }>;

/** Mutation hook that flips a room into `playing` and seeds its server game state. */
export function useStartGameMutation(): UseMutationResult<DotsRoomDetail, Error, StartGameArgs> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, request }: StartGameArgs) => startGame(roomId, request),
    onSuccess: (room) => {
      queryClient.setQueryData(DOTS_QUERY_KEYS.room(room.id), room);
      void queryClient.invalidateQueries({ queryKey: DOTS_QUERY_KEYS.roomsList });
    }
  });
}
