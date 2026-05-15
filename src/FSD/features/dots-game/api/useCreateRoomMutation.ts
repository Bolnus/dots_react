"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateRoomRequest, DotsRoomDetail } from "./dotsOnlineApiTypes";
import { createRoom } from "./mockServer";
import { syncRoomToCache } from "./queryKeys";

type UseCreateRoomMutationResult = Readonly<{
  mutate: (request: CreateRoomRequest) => void;
  data: DotsRoomDetail | undefined;
  error: Error | null;
  reset: () => void;
  isPending: boolean;
}>;

/** Mutation hook that creates a new room and syncs the resulting room into the query cache. */
export function useCreateRoomMutation(): UseCreateRoomMutationResult {
  const queryClient = useQueryClient();
  const { mutate, data, error, reset, isPending } = useMutation<DotsRoomDetail, Error, CreateRoomRequest>({
    mutationFn: (request) => createRoom(request),
    onSuccess: (room) => syncRoomToCache(queryClient, room)
  });
  return { mutate, data, error, reset, isPending };
}
