"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { LeaveRoomRequest } from "./dotsOnlineApiTypes";
import { leaveRoom } from "./dotsApi";
import { DOTS_QUERY_KEYS, dropRoomFromCache } from "./queryKeys";

type LeaveRoomArgs = Readonly<{ roomId: string; request: LeaveRoomRequest }>;

type UseLeaveRoomMutationResult = Readonly<{
  mutate: (args: LeaveRoomArgs) => void;
  error: Error | null;
  reset: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}>;

/** Mutation hook that leaves a room; drops the room cache entry and refreshes the rooms list. */
export function useLeaveRoomMutation(): UseLeaveRoomMutationResult {
  const queryClient = useQueryClient();
  const { mutate, error, reset, isPending, isSuccess, isError } = useMutation<void, Error, LeaveRoomArgs>({
    mutationFn: ({ roomId }) => leaveRoom(roomId),
    onSuccess: (_data, { roomId }) => {
      dropRoomFromCache(queryClient, roomId);
      void queryClient.invalidateQueries({ queryKey: DOTS_QUERY_KEYS.session });
    }
  });
  return { mutate, error, reset, isPending, isSuccess, isError };
}
