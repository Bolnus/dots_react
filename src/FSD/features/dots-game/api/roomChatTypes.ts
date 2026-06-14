import type { DotsChatMessage, DotsChatReadState } from "./dotsOnlineApiTypes";

export type UseRoomChatResult = Readonly<{
  messages: readonly DotsChatMessage[];
  readStates: readonly DotsChatReadState[];
  hasMoreBefore: boolean;
  isLoading: boolean;
  isFetchingOlder: boolean;
  isSending: boolean;
  hasUnread: boolean;
  typingUsers: readonly Readonly<{ userId: string; displayName: string; expiresAt: number }>[];
  loadOlderMessages: () => void;
  sendMessage: (content: string) => void;
  notifyTyping: () => void;
}>;
