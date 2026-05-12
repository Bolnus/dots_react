/** Stable react-query keys for the dots online API. */
export const DOTS_QUERY_KEYS = {
  roomsList: ["dots", "rooms"] as const,
  room: (roomId: string) => ["dots", "rooms", roomId] as const
};
