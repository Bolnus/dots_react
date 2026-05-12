"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import { DotsGameBackLink } from "./DotsGameBackLink";
import styles from "./DotsGameLobby.module.css";

export type DotsGameLobbyProps = Readonly<{
  onPickOnline: () => void;
  onPickHotSeat: () => void;
}>;

/** First view of the dots feature: pick Online or Hot seat; back link returns to the games home. */
export function DotsGameLobby({ onPickOnline, onPickHotSeat }: DotsGameLobbyProps): ReactElement {
  const t = useTranslations("DotsGame");
  return (
    <div className={styles.lobby}>
      <div className={styles.lobbyBack}>
        <DotsGameBackLink />
      </div>
      <h2 className={styles.title}>{t("lobbyTitle")}</h2>
      <div className={styles.optionGrid}>
        <button type="button" className={styles.optionButton} onClick={onPickOnline}>
          <span className={styles.optionLabel}>{t("lobbyOnline")}</span>
          <span className={styles.optionHint}>{t("lobbyOnlineHint")}</span>
        </button>
        <button type="button" className={styles.optionButton} onClick={onPickHotSeat}>
          <span className={styles.optionLabel}>{t("lobbyHotSeat")}</span>
          <span className={styles.optionHint}>{t("lobbyHotSeatHint")}</span>
        </button>
      </div>
    </div>
  );
}
