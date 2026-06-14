"use client";

import type { Dispatch, ReactElement, SetStateAction } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { MAX_CHAT_MESSAGE_LENGTH } from "../../api/dotsOnlineApiTypes";

import styles from "./ChatComposer.module.css";
import { ButtonIcon } from "@/FSD/shared/ui/button-icon/ButtonIcon";
import { TextInput } from "@/FSD/shared/ui/input/TextInput";

type ChatComposerProps = Readonly<{
  disabled?: boolean;
  isSending: boolean;
  onSend: (content: string) => void;
  onTyping: () => void;
}>;

/** Updates draft text and notifies the parent that the user is typing. */
function handleComposerChange(value: string, setDraft: Dispatch<SetStateAction<string>>, onTyping: () => void): void {
  setDraft(value.slice(0, MAX_CHAT_MESSAGE_LENGTH));
  onTyping();
}

/** Sends the current draft when allowed and clears the input. */
function handleComposerSend(
  canSend: boolean,
  trimmed: string,
  onSend: (content: string) => void,
  setDraft: Dispatch<SetStateAction<string>>
): void {
  if (!canSend) {
    return;
  }
  onSend(trimmed);
  setDraft("");
}

/** Chat message input with send button. */
export function ChatComposer({ disabled = false, isSending, onSend, onTyping }: ChatComposerProps): ReactElement {
  const t = useTranslations("DotsGame");
  const [draft, setDraft] = useState("");
  const trimmed = draft.trim();
  const canSend = !disabled && !isSending && trimmed.length > 0;

  return (
    <div className={styles.composer}>
      <TextInput
        className={styles.input}
        value={draft}
        disabled={disabled || isSending}
        placeholder={t("chatPlaceholder")}
        onChange={(value) => handleComposerChange(value, setDraft, onTyping)}
        onEnterKeyUp={() => handleComposerSend(canSend, trimmed, onSend, setDraft)}
      />
      <ButtonIcon
        iconName="send"
        iconColor="#ef4444"
        background="solid"
        title={t("chatSendAria")}
        disabled={!canSend}
        isFetching={isSending}
        onClick={() => handleComposerSend(canSend, trimmed, onSend, setDraft)}
      />
    </div>
  );
}
