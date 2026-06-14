"use client";

import type { ReactElement, RefObject } from "react";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import type { UseRoomChatResult } from "../../api/roomChatTypes";
import { useIntersectionObserver } from "@/FSD/shared/lib/hooks/useIntersectionObserver";

import { ChatComposer } from "./ChatComposer";
import { ChatMessageGroup } from "./ChatMessageGroup";
import { groupMessagesBySender } from "./chatMessageGroups";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import styles from "./RoomChatPanel.module.css";

export type RoomChatPanelProps = Readonly<{
  userId: string;
  opponentUserId: string | null;
  readOnly?: boolean;
  chat: UseRoomChatResult;
}>;

/** Scrolls the message list to the bottom when new messages arrive. */
function useScrollToBottom(listRef: RefObject<HTMLDivElement | null>, messageCount: number): void {
  useEffect(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messageCount, listRef]);
}

/** Chat message list and composer (layout-agnostic body). */
export function RoomChatPanel({ userId, opponentUserId, readOnly = false, chat }: RoomChatPanelProps): ReactElement {
  const t = useTranslations("DotsGame");
  const listRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const groups = groupMessagesBySender(chat.messages);
  const typingNames = chat.typingUsers.map((entry) => entry.displayName);
  const { loadOlderMessages, hasMoreBefore, isFetchingOlder } = chat;

  useScrollToBottom(listRef, chat.messages.length);

  const isTopSentinelIntersecting = useIntersectionObserver({
    sentinelRef: topSentinelRef,
    rootRef: listRef,
    enabled: hasMoreBefore && !isFetchingOlder
  });

  useEffect(() => {
    if (isTopSentinelIntersecting) {
      loadOlderMessages();
    }
  }, [isTopSentinelIntersecting, loadOlderMessages]);

  return (
    <div className={styles.panel}>
      <div ref={listRef} className={styles.messageList} aria-label={t("chatMessagesAria")}>
        <div ref={topSentinelRef} className={styles.topSentinel} />
        {chat.isFetchingOlder ? <div className={styles.loadingOlder}>{t("chatLoadingOlder")}</div> : null}
        {chat.isLoading ? <div className={styles.loading}>{t("chatLoading")}</div> : null}
        {groups.map((group) => (
          <ChatMessageGroup
            key={`${group.senderKey}-${group.messages[0]?.id ?? "empty"}`}
            group={group}
            ownUserId={userId}
            opponentUserId={opponentUserId}
            readStates={chat.readStates}
          />
        ))}
      </div>
      <ChatTypingIndicator names={typingNames} />
      <ChatComposer
        disabled={readOnly}
        isSending={chat.isSending}
        onSend={chat.sendMessage}
        onTyping={chat.notifyTyping}
      />
    </div>
  );
}
