"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";

import type { DotsRoomDetail } from "../api/dotsOnlineApiTypes";
import { useLeaveRoomMutation } from "../api/useLeaveRoomMutation";
import { useRoomLive } from "../api/useRoomLive";
import { useStartGameMutation } from "../api/useStartGameMutation";
import { useUpdateRoomMutation } from "../api/useUpdateRoomMutation";
import { DOTS_GRID_MAX, DOTS_GRID_MIN } from "../model/consts";
import { defaultDotsConfig, isValidGridDimension } from "../model/logic";
import type { DotsGameConfig, PlayerId } from "../model/types";

import { DotsGameBackButton } from "./DotsGameBackButton";
import { DotsGamePlay } from "./DotsGamePlay";
import { DotsGameStartButton } from "./DotsGameStartButton";
import styles from "./DotsOnlineRoomSetup.module.css";
import { ButtonIcon } from "@/FSD/shared/ui/button-icon/ButtonIcon";
import { NumberInput } from "@/FSD/shared/ui/input/NumberInput";
import { TextInput } from "@/FSD/shared/ui/input/TextInput";
import { NumberInputType } from "@/FSD/shared/ui/input/types";

const PLAYER_SLOTS = 2;

export type CreateRoomDraft = Readonly<{
  config: DotsGameConfig;
  isPrivate: boolean;
  password: string;
}>;

export type DotsOnlineRoomSetupProps = Readonly<{
  /** When `null`, the form is in "draft" mode: clicking the primary button creates the room. */
  roomId: string | null;
  userId: string;
  onBack: () => void;
  onGameStarted: (roomId: string) => void;
  onLeftRoom: () => void;
  onCreateRoom: (draft: CreateRoomDraft) => void;
}>;

type DraftFormState = Readonly<{
  rows: number | undefined;
  cols: number | undefined;
  isPrivate: boolean;
  password: string;
}>;

type ConfigFieldsProps = Readonly<{
  rows: number | undefined;
  cols: number | undefined;
  isPrivate: boolean;
  password: string;
  hasPasswordOnServer: boolean;
  showPassword: boolean;
  disabled: boolean;
  onRowsChange: (value: number | undefined) => void;
  onColsChange: (value: number | undefined) => void;
  onPrivateChange: (value: boolean) => void;
  onPasswordChange: (value: string) => void;
}>;

type RosterUser = Readonly<{ userId: string; displayName: string }>;

type RosterProps = Readonly<{
  title: string;
  users: readonly RosterUser[];
  ownerUserId: string;
  canKick: boolean;
  onKick: (userId: string) => void;
}>;

type EffectiveConfigArgs = Readonly<{
  rows: number | undefined;
  cols: number | undefined;
  defaults: DotsGameConfig;
}>;

type DraftRoomSetupBodyProps = Readonly<{
  draft: DraftFormState;
  setDraft: (next: DraftFormState) => void;
  defaults: DotsGameConfig;
  onBack: () => void;
  onCreate: () => void;
}>;

type InRoomSetupBodyProps = Readonly<{
  room: DotsRoomDetail;
  userId: string;
  defaults: DotsGameConfig;
  onBack: () => void;
  onStart: () => void;
  onPatch: (patch: Readonly<{ config?: DotsGameConfig; isPrivate?: boolean; password?: string }>) => void;
  onKick: (kickUserId: string) => void;
  onLeave: () => void;
  startError: string | null;
}>;

/** Shared grid / privacy / password form block (used by both draft and in-room modes). */
function ConfigFields(props: ConfigFieldsProps): ReactElement {
  const t = useTranslations("DotsGame");
  const passwordPlaceholder = props.hasPasswordOnServer ? "••••••" : t("passwordPlaceholder");
  return (
    <div className={styles.fields}>
      <label className={styles.fieldLabel}>
        <span>{t("rowsLabel")}</span>
        <NumberInput
          type={NumberInputType.Unsigned}
          value={props.rows}
          min={DOTS_GRID_MIN}
          max={DOTS_GRID_MAX}
          onChange={props.onRowsChange}
          disabled={props.disabled}
        />
      </label>
      <label className={styles.fieldLabel}>
        <span>{t("colsLabel")}</span>
        <NumberInput
          type={NumberInputType.Unsigned}
          value={props.cols}
          min={DOTS_GRID_MIN}
          max={DOTS_GRID_MAX}
          onChange={props.onColsChange}
          disabled={props.disabled}
        />
      </label>
      {props.showPassword ? (
        <label className={styles.fieldLabel}>
          <span>{t("passwordOptional")}</span>
          <TextInput
            value={props.password}
            onChange={props.onPasswordChange}
            placeholder={passwordPlaceholder}
            isPassword
            isClearable
            disabled={props.disabled}
          />
        </label>
      ) : null}
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={props.isPrivate}
          onChange={(event) => props.onPrivateChange(event.target.checked)}
          disabled={props.disabled}
        />
        <span>{t("private")}</span>
      </label>
    </div>
  );
}

/** Single roster panel: players or viewers, with optional kick buttons for the owner. */
function RosterPanel(props: RosterProps): ReactElement {
  const t = useTranslations("DotsGame");
  return (
    <div className={styles.rosterPanel}>
      <h3 className={styles.rosterTitle}>{props.title}</h3>
      {props.users.length === 0 ? (
        <div className={styles.rosterEmpty}>—</div>
      ) : (
        <ul className={styles.rosterList}>
          {props.users.map((user) => {
            const isOwnerRow = user.userId === props.ownerUserId;
            return (
              <li key={user.userId} className={styles.rosterRow}>
                <span className={styles.rosterMain}>
                  <span>{user.displayName}</span>
                  {isOwnerRow ? <span className={styles.ownerBadge}>★</span> : null}
                </span>
                {props.canKick && !isOwnerRow ? (
                  <ButtonIcon
                    onClick={() => props.onKick(user.userId)}
                    iconName="close"
                    iconSize="sm"
                    background="ghost"
                    title={t("kick")}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Falls back to defaults when inputs are out of range; produces a preview-friendly config. */
function buildEffectiveConfig(args: EffectiveConfigArgs): DotsGameConfig {
  return {
    rows: isValidGridDimension(args.rows) ? args.rows : args.defaults.rows,
    cols: isValidGridDimension(args.cols) ? args.cols : args.defaults.cols,
    cellSizePx: args.defaults.cellSizePx
  };
}

/** Draft-mode renderer: local-only state, never touches the server until "Create room" is clicked. */
function DraftRoomSetupBody({ draft, setDraft, defaults, onBack, onCreate }: DraftRoomSetupBodyProps): ReactElement {
  const t = useTranslations("DotsGame");
  const effectiveConfig = useMemo(
    () => buildEffectiveConfig({ rows: draft.rows, cols: draft.cols, defaults }),
    [draft.rows, draft.cols, defaults]
  );
  return (
    <div className={styles.setup}>
      <div className={styles.topBar}>
        <DotsGameBackButton onClick={onBack} label={t("back")} />
        <h2 className={styles.title}>{t("createRoomTitle")}</h2>
        <span aria-hidden style={{ width: 1 }} />
      </div>
      <ConfigFields
        rows={draft.rows}
        cols={draft.cols}
        isPrivate={draft.isPrivate}
        password={draft.password}
        hasPasswordOnServer={false}
        showPassword
        disabled={false}
        onRowsChange={(value) => setDraft({ ...draft, rows: value })}
        onColsChange={(value) => setDraft({ ...draft, cols: value })}
        onPrivateChange={(value) => setDraft({ ...draft, isPrivate: value })}
        onPasswordChange={(value) => setDraft({ ...draft, password: value })}
      />
      <div className={styles.actions}>
        <DotsGameStartButton onClick={onCreate}>{t("createRoomAction")}</DotsGameStartButton>
      </div>
      <div className={styles.preview}>
        <DotsGamePlay
          key={`preview-${effectiveConfig.rows}x${effectiveConfig.cols}`}
          config={effectiveConfig}
          playerLabels={{ player0: t("player0"), player1: t("player1") }}
          preview
        />
      </div>
    </div>
  );
}

/** Builds the labels record from the live room (falls back to defaults). */
function buildPlayerLabels(
  room: DotsRoomDetail,
  t: ReturnType<typeof useTranslations>
): Readonly<Record<PlayerId, string>> {
  return {
    player0: room.players.find((player) => player.slot === "player0")?.user.displayName ?? t("player0"),
    player1: room.players.find((player) => player.slot === "player1")?.user.displayName ?? t("player1")
  };
}

/** Sorts roster users so the player0 slot lands first; keeps original order otherwise. */
function sortedPlayerUsers(room: DotsRoomDetail): RosterUser[] {
  const sorted = room.players.slice().sort((left, right) => {
    if (left.slot === right.slot) {
      return 0;
    }
    if (left.slot === "player0") {
      return -1;
    }
    return 1;
  });
  return sorted.map((player) => player.user);
}

/** In-room mode renderer: live-updates from `useRoomLive`; owner-only fields propagate to the server. */
function InRoomSetupBody(props: InRoomSetupBodyProps): ReactElement {
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
        <DotsGameBackButton onClick={props.onBack} label={t("back")} />
        <h2 className={styles.title}>{room.name}</h2>
        <button type="button" className={styles.changeNameButton} onClick={props.onLeave}>
          {t("leave")}
        </button>
      </div>
      {isOwner ? null : <p className={styles.subtitle}>{t("ownerOnlyConfig")}</p>}
      <ConfigFields
        rows={room.config.rows}
        cols={room.config.cols}
        isPrivate={room.isPrivate}
        password=""
        hasPasswordOnServer={room.hasPassword}
        showPassword={isOwner}
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
        onPrivateChange={(value) => props.onPatch({ isPrivate: value })}
        onPasswordChange={(value) => props.onPatch({ password: value })}
      />
      <div className={styles.rosters}>
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
      </div>
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

/** Online configuration view: in draft mode shows "Create room"; in in-room mode shows roster + "Start game". */
export function DotsOnlineRoomSetup(props: DotsOnlineRoomSetupProps): ReactElement {
  const defaults = useMemo(() => defaultDotsConfig(), []);
  const [draft, setDraft] = useState<DraftFormState>(() => ({
    rows: defaults.rows,
    cols: defaults.cols,
    isPrivate: false,
    password: ""
  }));
  const [startError, setStartError] = useState<string | null>(null);

  const { roomId, userId, onBack, onGameStarted, onLeftRoom, onCreateRoom } = props;
  const live = useRoomLive(roomId);
  const { room } = live;

  const updateMutation = useUpdateRoomMutation();
  const startMutation = useStartGameMutation();
  const leaveMutation = useLeaveRoomMutation();

  useEffect(() => {
    if (roomId && room && room.status === "playing") {
      onGameStarted(room.id);
    }
  }, [roomId, room, onGameStarted]);

  if (!roomId) {
    return (
      <DraftRoomSetupBody
        draft={draft}
        setDraft={setDraft}
        defaults={defaults}
        onBack={onBack}
        onCreate={() => {
          const effectiveConfig = buildEffectiveConfig({ rows: draft.rows, cols: draft.cols, defaults });
          onCreateRoom({
            config: effectiveConfig,
            isPrivate: draft.isPrivate || draft.password.trim().length > 0,
            password: draft.password
          });
        }}
      />
    );
  }

  if (!room) {
    return <div className={styles.setup}>...</div>;
  }

  return (
    <InRoomSetupBody
      room={room}
      userId={userId}
      defaults={defaults}
      onBack={onBack}
      onStart={() => {
        setStartError(null);
        startMutation.mutate(
          { roomId: room.id, request: { byUserId: userId } },
          { onError: (error) => setStartError(error.message) }
        );
      }}
      onPatch={(patch) =>
        updateMutation.mutate({
          roomId: room.id,
          request: { byUserId: userId, ...patch }
        })
      }
      onKick={(kickUserId) =>
        updateMutation.mutate({
          roomId: room.id,
          request: { byUserId: userId, kickUserId }
        })
      }
      onLeave={() => {
        leaveMutation.mutate({ roomId: room.id, request: { userId } }, { onSuccess: () => onLeftRoom() });
      }}
      startError={startError}
    />
  );
}
