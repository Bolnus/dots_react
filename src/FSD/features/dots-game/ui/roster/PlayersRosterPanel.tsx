"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import type { DotsRoomDetail } from "../../api/dotsOnlineApiTypes";
import type { PlayerId } from "../../model/types";
import { PLAYER_SLOTS } from "../online/DotsOnlineRoomSetup/roomSetupUtils";

import panelStyles from "./RosterPanel.module.css";
import { RosterRow, type RosterUser } from "./RosterRow";
import styles from "./PlayersRosterPanel.module.css";
import { Icon } from "@/FSD/shared/ui/icon/Icon";

type PlayersRosterPanelProps = Readonly<{
  room: DotsRoomDetail;
  ownerUserId: string;
  canKick: boolean;
  canAddAi: boolean;
  isAddingAi: boolean;
  onKick: (userId: string) => void;
  onAddAi: () => void;
}>;

/** Finds the roster user occupying a player slot, if any. */
function playerForSlot(room: DotsRoomDetail, slot: PlayerId): RosterUser | null {
  const entry = room.players.find((player) => player.slot === slot);
  return entry?.user ?? null;
}

/** Renders the fixed two-slot players roster with an optional "Add AI" action. */
export function PlayersRosterPanel({
  room,
  ownerUserId,
  canKick,
  canAddAi,
  isAddingAi,
  onKick,
  onAddAi
}: PlayersRosterPanelProps): ReactElement {
  const t = useTranslations("DotsGame");
  const player0 = playerForSlot(room, "player0");
  const player1 = playerForSlot(room, "player1");
  const showAddAi = canAddAi && player1 === null && room.players.length < PLAYER_SLOTS;

  return (
    <div className={panelStyles.rosterPanel}>
      <h3 className={panelStyles.rosterTitle}>{t("players")}</h3>
      <ul className={panelStyles.rosterList}>
        {player0 ? (
          <RosterRow
            user={player0}
            isOwner={player0.userId === ownerUserId}
            canKick={canKick}
            kickLabel={t("kick")}
            onKick={onKick}
          />
        ) : null}
        {player1 ? (
          <RosterRow
            user={player1}
            isOwner={player1.userId === ownerUserId}
            canKick={canKick}
            kickLabel={t("kick")}
            onKick={onKick}
          />
        ) : null}
        {showAddAi ? (
          <li className={styles.addAiRow}>
            <button
              type="button"
              className={styles.addAiButton}
              onClick={onAddAi}
              disabled={isAddingAi}
              aria-busy={isAddingAi}
            >
              {isAddingAi ? <Icon iconName="fetching" size="sm" title={t("addingAi")} /> : null}
              {isAddingAi ? t("addingAi") : t("addAi")}
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
