"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { DotsRoomDetail, JoinRoomRequest } from "./dotsOnlineApiTypes";
import { joinRoom } from "./dotsApi";
import { DOTS_QUERY_KEYS, syncRoomToCache } from "./queryKeys";

type JoinRoomArgs = Readonly<{ roomId: string; request: JoinRoomRequest }>;

type UseJoinRoomMutationResult = Readonly<{
  mutate: (args: JoinRoomArgs) => void;
  data: DotsRoomDetail | undefined;
  error: Error | null;
  reset: () => void;
  isPending: boolean;
  variables: JoinRoomArgs | undefined;
}>;

/** Mutation hook that joins a room (as player or viewer) and syncs the room into the query cache. */
export function useJoinRoomMutation(): UseJoinRoomMutationResult {
  const queryClient = useQueryClient();
  const { mutate, data, error, reset, isPending, variables } = useMutation<DotsRoomDetail, Error, JoinRoomArgs>({
    mutationFn: ({ roomId, request }) => joinRoom(roomId, request),
    onSuccess: (room) => {
      syncRoomToCache(queryClient, room);
      void queryClient.invalidateQueries({ queryKey: DOTS_QUERY_KEYS.session });
    }
  });
  return { mutate, data, error, reset, isPending, variables };
}
