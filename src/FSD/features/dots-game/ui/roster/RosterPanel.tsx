"use client";

import type { ReactElement, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { RosterRow, type RosterUser } from "./RosterRow";
import panelStyles from "./RosterPanel.module.css";

export type { RosterUser };

export type RosterPanelProps = Readonly<{
  title: string;
  users: readonly RosterUser[];
  ownerUserId: string;
  canKick: boolean;
  onKick: (userId: string) => void;
}>;

/** Roster panel: players or viewers, with optional kick buttons for the room owner. */
export function RosterPanel(props: RosterPanelProps): ReactElement {
  const t = useTranslations("DotsGame");
  return (
    <div className={panelStyles.rosterPanel}>
      <h3 className={panelStyles.rosterTitle}>{props.title}</h3>
      {props.users.length === 0 ? (
        <div className={panelStyles.rosterEmpty}>—</div>
      ) : (
        <ul className={panelStyles.rosterList}>
          {props.users.map((user) => (
            <RosterRow
              key={user.userId}
              user={user}
              isOwner={user.userId === props.ownerUserId}
              canKick={props.canKick}
              kickLabel={t("kick")}
              onKick={props.onKick}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Two-column layout wrapper for player and viewer roster panels. */
export function RostersGrid({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className={panelStyles.rosters}>{children}</div>;
}
