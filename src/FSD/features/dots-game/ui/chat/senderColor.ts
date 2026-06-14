import { fnv1a32 } from "@/FSD/shared/lib/hash/fnv1a";

const SENDER_COLORS = [
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#38bdf8",
  "#fb923c",
  "#e879f9",
  "#4ade80",
  "#f472b6",
  "#22d3ee",
  "#c084fc",
  "#86efac",
  "#fcd34d"
] as const;

/** Returns a stable readable color for a chat sender key. */
export function senderColorForKey(senderKey: string): string {
  const index = fnv1a32(senderKey) % SENDER_COLORS.length;
  return SENDER_COLORS[index] ?? SENDER_COLORS[0];
}

/** Formats a message timestamp as short local time (HH:mm). */
export function formatChatTime(createdAtMs: number): string {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(createdAtMs));
}
