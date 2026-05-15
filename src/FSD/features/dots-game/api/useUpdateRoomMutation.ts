"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { DotsRoomDetail, PatchRoomRequest } from "./dotsOnlineApiTypes";
import { patchRoom } from "./mockServer";
import { syncRoomToCache } from "./queryKeys";

type UpdateRoomArgs = Readonly<{ roomId: string; request: PatchRoomRequest }>;

type UseUpdateRoomMutationResult = Readonly<{
  mutate: (args: UpdateRoomArgs) => void;
  data: DotsRoomDetail | undefined;
  error: Error | null;
  reset: () => void;
  isPending: boolean;
}>;

/** Mutation hook that patches a room as its owner; broadcasts via the live channel. */
export function useUpdateRoomMutation(): UseUpdateRoomMutationResult {
  const queryClient = useQueryClient();
  const { mutate, data, error, reset, isPending } = useMutation<DotsRoomDetail, Error, UpdateRoomArgs>({
    mutationFn: ({ roomId, request }) => patchRoom(roomId, request),
    onSuccess: (room) => syncRoomToCache(queryClient, room)
  });
  return { mutate, data, error, reset, isPending };
}
