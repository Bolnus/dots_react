"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import type { DotsRoomDetail } from "../../../api/dotsOnlineApiTypes";
import { isValidGridDimension } from "../../../model/logic";
import type { DotsGameConfig } from "../../../model/types";

import { DotsGamePlay } from "../../play/DotsGamePlay";
import { DotsGameStartButton } from "../../play/DotsGameStartButton";
import { PlayersRosterPanel } from "../../roster/PlayersRosterPanel";
import { RosterPanel, RostersGrid } from "../../roster/RosterPanel";
import { buildEffectiveConfig, buildPlayerLabels, PLAYER_SLOTS } from "./roomSetupUtils";
import { GridSizeFields } from "./GridSizeFields";
import styles from "./InRoomSetupBody.module.css";
import { RoomSetupMutation } from "./types";
import { BackButton } from "@/FSD/shared/ui/back-button/BackButton";

type InRoomSetupBodyProps = Readonly<{
  room: DotsRoomDetail;
  userId: string;
  defaults: DotsGameConfig;
  isLeaving?: boolean;
  pendingMutation?: (typeof RoomSetupMutation)[keyof typeof RoomSetupMutation];
  onBack: () => void;
  onStart: () => void;
  onPatch: (
    patch: Readonly<{ config?: Readonly<{ rows: number; cols: number }>; isPrivate?: boolean; password?: string }>
  ) => void;
  onKick: (kickUserId: string) => void;
  onAddAi: () => void;
}>;

/** In-room mode renderer: live-updates from `useRoomLive`; owner-only fields propagate to the server. */
export function InRoomSetupBody({
  room,
  userId,
  defaults,
  isLeaving = false,
  pendingMutation = RoomSetupMutation.Idle,
  onBack,
  onStart,
  onPatch,
  onKick,
  onAddAi
}: InRoomSetupBodyProps): ReactElement {
  const t = useTranslations("DotsGame");
  const isOwner = room.ownerUserId === userId;
  const effectiveConfig = useMemo(
    () => buildEffectiveConfig({ rows: room.config.rows, cols: room.config.cols, defaults }),
    [room.config.rows, room.config.cols, defaults]
  );
  const playerLabels = useMemo(() => buildPlayerLabels(room, t), [room, t]);
  const canStart = isOwner && room.players.length === PLAYER_SLOTS;
  const fieldsDisabled = !isOwner || pendingMutation === RoomSetupMutation.Patching;

  return (
    <div className={styles.setup}>
      <div className={styles.topBar}>
        <BackButton onClick={onBack} label={t("back")} />
        <h2 className={styles.title}>{room.name}</h2>
        <button type="button" className={styles.changeNameButton} onClick={onBack} disabled={isLeaving}>
          {t("leave")}
        </button>
      </div>
      {isOwner ? null : <p className={styles.subtitle}>{t("ownerOnlyConfig")}</p>}
      <GridSizeFields
        rows={room.config.rows}
        cols={room.config.cols}
        disabled={fieldsDisabled}
        onRowsChange={(value) =>
          onPatch({
            config: { ...room.config, rows: isValidGridDimension(value) ? value : room.config.rows }
          })
        }
        onColsChange={(value) =>
          onPatch({
            config: { ...room.config, cols: isValidGridDimension(value) ? value : room.config.cols }
          })
        }
      />
      <RostersGrid>
        <PlayersRosterPanel
          room={room}
          ownerUserId={room.ownerUserId}
          canKick={isOwner}
          canAddAi={isOwner}
          isAddingAi={pendingMutation === RoomSetupMutation.AddingAi}
          onKick={onKick}
          onAddAi={onAddAi}
        />
        <RosterPanel
          title={t("viewersTitle")}
          users={room.viewers}
          ownerUserId={room.ownerUserId}
          canKick={isOwner}
          onKick={onKick}
        />
      </RostersGrid>
      {isOwner && !canStart ? <p className={styles.ownerHint}>{t("notEnoughPlayers")}</p> : null}
      <div className={styles.actions}>
        {isOwner ? (
          <DotsGameStartButton
            onClick={onStart}
            disabled={!canStart}
            isLoading={pendingMutation === RoomSetupMutation.Starting}
          >
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
