"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import { Icon } from "@/FSD/shared/ui/icon/Icon";

import styles from "./ChatPanelHeader.module.css";

type ChatPanelHeaderProps = Readonly<{
  opponentName: string;
  viewerCount: number;
}>;

/** Chat panel title row: opponent name and viewer count. */
export function ChatPanelHeader({ opponentName, viewerCount }: ChatPanelHeaderProps): ReactElement {
  const t = useTranslations("DotsGame");

  return (
    <div className={styles.header}>
      <span className={styles.opponentName}>{opponentName}</span>
      <span className={styles.viewerBadge} aria-label={t("chatHeaderViewers", { count: viewerCount })}>
        <Icon iconName="viewers" size="sm" />
        <span>{viewerCount}</span>
      </span>
    </div>
  );
}
