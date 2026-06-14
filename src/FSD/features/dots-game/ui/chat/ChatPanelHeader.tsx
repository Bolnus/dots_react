"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import { ButtonIcon } from "@/FSD/shared/ui/button-icon/ButtonIcon";
import { Icon } from "@/FSD/shared/ui/icon/Icon";

import styles from "./ChatPanelHeader.module.css";

type ChatPanelHeaderProps = Readonly<{
  opponentName: string;
  viewerCount: number;
  /** When set, a back-to-board button is shown before the header content. */
  onBoardView?: () => void;
}>;

/** Renders the opponent name and viewer count row for the chat panel. */
function ChatHeaderContent({
  opponentName,
  viewerCount,
  viewersAriaLabel
}: Readonly<{
  opponentName: string;
  viewerCount: number;
  viewersAriaLabel: string;
}>): ReactElement {
  return (
    <div className={styles.header}>
      <span className={styles.opponentName}>{opponentName}</span>
      <span className={styles.viewerBadge} aria-label={viewersAriaLabel}>
        <Icon iconName="viewers" size="sm" />
        <span>{viewerCount}</span>
      </span>
    </div>
  );
}

/** Chat panel title row: opponent name and viewer count. */
export function ChatPanelHeader({ opponentName, viewerCount, onBoardView }: ChatPanelHeaderProps): ReactElement {
  const t = useTranslations("DotsGame");
  const viewersAriaLabel = t("chatHeaderViewers", { count: viewerCount });
  const headerContent = (
    <ChatHeaderContent opponentName={opponentName} viewerCount={viewerCount} viewersAriaLabel={viewersAriaLabel} />
  );

  if (onBoardView) {
    return (
      <div className={styles.mobileNav}>
        <ButtonIcon iconName="board" background="ghost" title={t("gameToggleAria")} onClick={onBoardView} />
        <div className={styles.headerSlot}>{headerContent}</div>
      </div>
    );
  }

  return <div className={styles.desktopRoot}>{headerContent}</div>;
}
