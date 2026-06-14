"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import type { DotsChatMessage, DotsChatReadState } from "../../api/dotsOnlineApiTypes";
import { isOwnMessageRead } from "../../api/useRoomChat";

import { formatChatTime } from "./senderColor";
import styles from "./ChatMessageBubble.module.css";

export type ChatMessageBubbleProps = Readonly<{
  message: DotsChatMessage;
  isOwn: boolean;
  ownUserId: string;
  opponentUserId: string | null;
  readStates: readonly DotsChatReadState[];
}>;

/** Single chat message bubble with timestamp and delivery ticks for own messages. */
export function ChatMessageBubble({
  message,
  isOwn,
  ownUserId,
  opponentUserId,
  readStates
}: ChatMessageBubbleProps): ReactElement {
  const t = useTranslations("DotsGame");
  const isRead = isOwnMessageRead(message, ownUserId, opponentUserId, readStates);

  return (
    <div className={isOwn ? styles.bubbleOwn : styles.bubbleOther}>
      <div className={styles.content}>{message.content}</div>
      <div className={styles.meta}>
        <span className={styles.time}>{formatChatTime(message.createdAtMs)}</span>
        {isOwn ? (
          <span className={styles.status} aria-label={isRead ? t("chatRead") : t("chatDelivered")}>
            <span className={isRead ? styles.tickRead : styles.tickDelivered}>✓</span>
            {isRead ? <span className={styles.tickRead}>✓</span> : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}
