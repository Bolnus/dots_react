"use client";

import type { ReactElement } from "react";

import { ButtonIcon } from "@/FSD/shared/ui/button-icon/ButtonIcon";
import { Icon } from "@/FSD/shared/ui/icon/Icon";

import styles from "./RosterRow.module.css";

export type RosterUser = Readonly<{ userId: string; displayName: string; isAi?: boolean }>;

export type RosterRowProps = Readonly<{
  user: RosterUser;
  isOwner: boolean;
  canKick: boolean;
  kickLabel: string;
  onKick: (userId: string) => void;
}>;

/** Single roster row: display name, owner badge, optional kick control. */
export function RosterRow({ user, isOwner, canKick, kickLabel, onKick }: RosterRowProps): ReactElement {
  return (
    <li className={styles.rosterRow}>
      <span className={styles.rosterMain}>
        {user.isAi ? <Icon iconName="ai" size="md" /> : null}
        <span>{user.displayName}</span>
        {isOwner ? <span className={styles.ownerBadge}>★</span> : null}
      </span>
      {canKick && !isOwner ? (
        <ButtonIcon
          onClick={() => onKick(user.userId)}
          iconName="close"
          iconSize="sm"
          background="ghost"
          title={kickLabel}
        />
      ) : null}
    </li>
  );
}
