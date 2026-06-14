import type { DotsChatMessage } from "../../api/dotsOnlineApiTypes";

export type ChatMessageGroup = Readonly<{
  senderKey: string;
  senderDisplayName: string;
  senderKind: DotsChatMessage["senderKind"];
  messages: readonly DotsChatMessage[];
}>;

/** Builds a stable sender key for grouping consecutive messages. */
export function senderKeyForMessage(message: DotsChatMessage): string {
  if (message.senderKind === "ai") {
    return "ai";
  }
  return message.senderUserId ?? message.senderKind;
}

/** Groups consecutive messages from the same sender. */
export function groupMessagesBySender(messages: readonly DotsChatMessage[]): readonly ChatMessageGroup[] {
  const groups: ChatMessageGroup[] = [];
  for (const message of messages) {
    const key = senderKeyForMessage(message);
    const last = groups[groups.length - 1];
    if (last && last.senderKey === key) {
      groups[groups.length - 1] = { ...last, messages: [...last.messages, message] };
    } else {
      groups.push({
        senderKey: key,
        senderDisplayName: message.senderDisplayName ?? message.senderKind,
        senderKind: message.senderKind,
        messages: [message]
      });
    }
  }
  return groups;
}
