"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import type { DotsChatReadState } from "../../api/dotsOnlineApiTypes";

import { ChatMessageBubble } from "./ChatMessageBubble";
import type { ChatMessageGroup as ChatMessageGroupType } from "./chatMessageGroups";
import { senderColorForKey } from "./senderColor";
import styles from "./ChatMessageGroup.module.css";

export type ChatMessageGroupProps = Readonly<{
  group: ChatMessageGroupType;
  ownUserId: string;
  opponentUserId: string | null;
  readStates: readonly DotsChatReadState[];
}>;

/** Resolves a localized fallback display name for a sender kind. */
function senderLabel(t: ReturnType<typeof useTranslations>, group: ChatMessageGroupType): string {
  if (group.senderKind === "ai") {
    return t("chatSenderAi");
  }
  if (group.senderKind === "viewer") {
    return t("chatSenderViewer");
  }
  return group.senderDisplayName || t("chatSenderPlayer");
}

/** Renders a run of consecutive messages from one sender with a shared username header. */
export function ChatMessageGroup({
  group,
  ownUserId,
  opponentUserId,
  readStates
}: ChatMessageGroupProps): ReactElement {
  const t = useTranslations("DotsGame");
  const isOwnGroup = group.messages.every((message) => message.senderUserId === ownUserId);
  const label = senderLabel(t, group);

  return (
    <div className={isOwnGroup ? styles.groupOwn : styles.groupOther}>
      <div className={styles.senderName} style={{ color: senderColorForKey(group.senderKey) }}>
        {label}
      </div>
      <div className={styles.bubbles}>
        {group.messages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderUserId === ownUserId}
            ownUserId={ownUserId}
            opponentUserId={opponentUserId}
            readStates={readStates}
          />
        ))}
      </div>
    </div>
  );
}
