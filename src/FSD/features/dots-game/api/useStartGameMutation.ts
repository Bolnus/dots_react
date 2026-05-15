"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { DotsRoomDetail, StartGameRequest } from "./dotsOnlineApiTypes";
import { startGame } from "./mockServer";
import { syncRoomToCache } from "./queryKeys";

type StartGameArgs = Readonly<{ roomId: string; request: StartGameRequest }>;

type UseStartGameMutationResult = Readonly<{
  mutate: (args: StartGameArgs) => void;
  data: DotsRoomDetail | undefined;
  error: Error | null;
  reset: () => void;
  isPending: boolean;
}>;

/** Mutation hook that flips a room into `playing` and seeds its server game state. */
export function useStartGameMutation(): UseStartGameMutationResult {
  const queryClient = useQueryClient();
  const { mutate, data, error, reset, isPending } = useMutation<DotsRoomDetail, Error, StartGameArgs>({
    mutationFn: ({ roomId, request }) => startGame(roomId, request),
    onSuccess: (room) => syncRoomToCache(queryClient, room)
  });
  return { mutate, data, error, reset, isPending };
}
