import type { DotsChatMessage } from "../../api/dotsOnlineApiTypes";

export type ChatMessageGroup = Readonly<{
  senderKey: string;
  senderDisplayName: string;
  senderKind: DotsChatMessage["senderKind"];
  messages: readonly DotsChatMessage[];
}>;
