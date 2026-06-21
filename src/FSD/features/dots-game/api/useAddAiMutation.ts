"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AddAiResult } from "./dotsOnlineApiTypes";
import { addAiPlayer } from "./dotsApi";
import { syncRoomToCache } from "./queryKeys";

type UseAddAiMutationResult = Readonly<{
  mutate: (roomId: string) => void;
  data: AddAiResult | undefined;
  error: Error | null;
  reset: () => void;
  isPending: boolean;
  isSuccess: boolean;
}>;

/** Mutation hook that adds an AI player to the second slot in a waiting room. */
export function useAddAiMutation(): UseAddAiMutationResult {
  const queryClient = useQueryClient();
  const { mutate, data, error, reset, isPending, isSuccess } = useMutation<AddAiResult, Error, string>({
    mutationFn: (roomId) => addAiPlayer(roomId),
    onSuccess: (result) => syncRoomToCache(queryClient, result.room)
  });
  return { mutate, data, error, reset, isPending, isSuccess };
}
