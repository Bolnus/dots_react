"use client";

import type { ReactElement, RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { UseRoomChatResult } from "../../api/roomChatTypes";
import { useIntersectionObserver } from "@/FSD/shared/lib/hooks/useIntersectionObserver";

import { ChatComposer } from "./ChatComposer";
import { ChatMessageGroup } from "./ChatMessageGroup";
import { groupMessagesBySender } from "./chatMessageGroups";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import styles from "./RoomChatPanel.module.css";

type RoomChatPanelProps = Readonly<{
  userId: string;
  opponentUserId: string | null;
  readOnly?: boolean;
  chat: UseRoomChatResult;
}>;

/** Scrolls a message list when its container becomes visible after being hidden. */
function scrollMessageListOnBecomeVisible(
  element: HTMLDivElement,
  hadVisibleHeight: boolean,
  onBecomeVisible: () => void
): boolean {
  const hasVisibleHeight = element.clientHeight > 0;
  if (!hadVisibleHeight && hasVisibleHeight) {
    element.scrollTop = element.scrollHeight;
    onBecomeVisible();
  }
  return hasVisibleHeight;
}

/** Scrolls the message list to the bottom when messages load or grow. */
function useScrollToBottom(
  listRef: RefObject<HTMLDivElement | null>,
  messageCount: number,
  isReady: boolean
): boolean {
  const [canLoadOlder, setCanLoadOlder] = useState(false);

  useLayoutEffect(() => {
    if (!isReady) {
      setCanLoadOlder(false);
      return;
    }
    const el = listRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
    setCanLoadOlder(true);
  }, [messageCount, isReady, listRef]);

  // Panel may mount hidden (display: none); scroll once it becomes visible.
  useEffect(() => {
    const el = listRef.current;
    if (!el || !isReady) {
      return undefined;
    }

    let hadVisibleHeight = el.clientHeight > 0;

    const observer = new ResizeObserver(() => {
      hadVisibleHeight = scrollMessageListOnBecomeVisible(el, hadVisibleHeight, () => setCanLoadOlder(true));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [isReady, listRef]);

  return canLoadOlder;
}

/** Chat message list and composer (layout-agnostic body). */
export function RoomChatPanel({ userId, opponentUserId, readOnly = false, chat }: RoomChatPanelProps): ReactElement {
  const t = useTranslations("DotsGame");
  const listRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const groups = groupMessagesBySender(chat.messages);
  const typingNames = chat.typingUsers.map((entry) => entry.displayName);
  const { loadOlderMessages, hasMoreBefore, isFetchingOlder } = chat;

  const canLoadOlder = useScrollToBottom(listRef, chat.messages.length, !chat.isLoading);

  const isTopSentinelIntersecting = useIntersectionObserver({
    sentinelRef: topSentinelRef,
    rootRef: listRef,
    enabled: hasMoreBefore && !isFetchingOlder && canLoadOlder
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
