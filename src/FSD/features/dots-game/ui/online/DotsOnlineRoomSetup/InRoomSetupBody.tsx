"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import type { DotsRoomDetail } from "../../../api/dotsOnlineApiTypes";
import { isValidGridDimension } from "../../../model/logic";
import type { DotsGameConfig } from "../../../model/types";

import { DotsGamePlay } from "../../play/DotsGamePlay";
import { DotsGameStartButton } from "../../play/DotsGameStartButton";
import { RosterPanel, RostersGrid } from "../../roster/RosterPanel";
import { buildEffectiveConfig } from "./roomSetupUtils";
import { GridSizeFields } from "./GridSizeFields";
import styles from "./InRoomSetupBody.module.css";
import { buildPlayerLabels, PLAYER_SLOTS, sortedPlayerUsers } from "./roomSetupUtils";
import { BackButton } from "@/FSD/shared/ui/back-button/BackButton";

type InRoomSetupBodyProps = Readonly<{
  room: DotsRoomDetail;
  userId: string;
  defaults: DotsGameConfig;
  isLeaving?: boolean;
  onBack: () => void;
  onStart: () => void;
  onPatch: (
    patch: Readonly<{ config?: Readonly<{ rows: number; cols: number }>; isPrivate?: boolean; password?: string }>
  ) => void;
  onKick: (kickUserId: string) => void;
  onLeave: () => void;
  startError: string | null;
}>;

/** In-room mode renderer: live-updates from `useRoomLive`; owner-only fields propagate to the server. */
export function InRoomSetupBody(props: InRoomSetupBodyProps): ReactElement {
  const t = useTranslations("DotsGame");
  const { room } = props;
  const isOwner = room.ownerUserId === props.userId;
  const players = useMemo(() => sortedPlayerUsers(room), [room]);
  const effectiveConfig = useMemo(
    () => buildEffectiveConfig({ rows: room.config.rows, cols: room.config.cols, defaults: props.defaults }),
    [room.config.rows, room.config.cols, props.defaults]
  );
  const playerLabels = useMemo(() => buildPlayerLabels(room, t), [room, t]);
  const canStart = isOwner && room.players.length === PLAYER_SLOTS;

  return (
    <div className={styles.setup}>
      <div className={styles.topBar}>
        <BackButton onClick={props.onBack} label={t("back")} />
        <h2 className={styles.title}>{room.name}</h2>
        <button type="button" className={styles.changeNameButton} onClick={props.onLeave} disabled={props.isLeaving}>
          {t("leave")}
        </button>
      </div>
      {isOwner ? null : <p className={styles.subtitle}>{t("ownerOnlyConfig")}</p>}
      <GridSizeFields
        rows={room.config.rows}
        cols={room.config.cols}
        disabled={!isOwner}
        onRowsChange={(value) =>
          props.onPatch({
            config: { ...room.config, rows: isValidGridDimension(value) ? value : room.config.rows }
          })
        }
        onColsChange={(value) =>
          props.onPatch({
            config: { ...room.config, cols: isValidGridDimension(value) ? value : room.config.cols }
          })
        }
      />
      <RostersGrid>
        <RosterPanel
          title={t("players")}
          users={players}
          ownerUserId={room.ownerUserId}
          canKick={isOwner}
          onKick={props.onKick}
        />
        <RosterPanel
          title={t("viewersTitle")}
          users={room.viewers}
          ownerUserId={room.ownerUserId}
          canKick={isOwner}
          onKick={props.onKick}
        />
      </RostersGrid>
      {props.startError ? <p className={styles.error}>{props.startError}</p> : null}
      {isOwner && !canStart ? <p className={styles.ownerHint}>{t("notEnoughPlayers")}</p> : null}
      <div className={styles.actions}>
        {isOwner ? (
          <DotsGameStartButton onClick={props.onStart} disabled={!canStart}>
            {t("startGame")}
          </DotsGameStartButton>
        ) : null}
      </div>
      <div className={styles.preview}>
        <DotsGamePlay
          key={`preview-${effectiveConfig.rows}x${effectiveConfig.cols}`}
          config={effectiveConfig}
          playerLabels={playerLabels}
          preview
        />
      </div>
    </div>
  );
}
