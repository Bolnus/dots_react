"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import styles from "./DotsMainMenu.module.css";
import { BackLink } from "@/FSD/shared/ui/back-link/BackLink";
import { OptionButton } from "@/FSD/shared/ui/option-button/OptionButton";

export type DotsMainMenuProps = Readonly<{
  onPickOnline: () => void;
  onPickHotSeat: () => void;
}>;

/** First view of the dots feature: pick Online or Hot seat; back link returns to the games home. */
export function DotsMainMenu({ onPickOnline, onPickHotSeat }: DotsMainMenuProps): ReactElement {
  const t = useTranslations("DotsGame");
  const tPage = useTranslations("GamePage");
  return (
    <div className={styles.menu}>
      <div className={styles.menuBack}>
        <BackLink href="/" label={tPage("back")} prefetch={false} />
      </div>
      <h2 className={styles.title}>{t("lobbyTitle")}</h2>
      <div className={styles.optionGrid}>
        <OptionButton label={t("lobbyOnline")} hint={t("lobbyOnlineHint")} onClick={onPickOnline} />
        <OptionButton label={t("lobbyHotSeat")} hint={t("lobbyHotSeatHint")} onClick={onPickHotSeat} />
      </div>
    </div>
  );
}
