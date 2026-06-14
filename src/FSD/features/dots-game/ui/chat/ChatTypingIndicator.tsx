"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import styles from "./ChatTypingIndicator.module.css";

export type ChatTypingIndicatorProps = Readonly<{
  names: readonly string[];
}>;

/** Shows who is currently typing in the chat. */
export function ChatTypingIndicator({ names }: ChatTypingIndicatorProps): ReactElement | null {
  const t = useTranslations("DotsGame");
  if (names.length === 0) {
    return null;
  }

  const label =
    names.length === 1 ? t("chatTypingOne", { name: names[0] }) : t("chatTypingMany", { names: names.join(", ") });

  return <div className={styles.indicator}>{label}</div>;
}
