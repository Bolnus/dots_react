"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import { DotsGameBackLink } from "./DotsGameBackLink";
import styles from "./DotsGameLobby.module.css";
import { OptionButton } from "@/FSD/shared/ui/option-button/OptionButton";

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
        <OptionButton label={t("lobbyOnline")} hint={t("lobbyOnlineHint")} onClick={onPickOnline} />
        <OptionButton label={t("lobbyHotSeat")} hint={t("lobbyHotSeatHint")} onClick={onPickHotSeat} />
      </div>
    </div>
  );
}
