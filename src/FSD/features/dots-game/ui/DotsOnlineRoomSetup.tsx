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

import { DotsGamePlay } from "./DotsGamePlay";
import { DotsGameStartButton } from "./DotsGameStartButton";
import styles from "./DotsOnlineRoomSetup.module.css";
import { BackButton } from "@/FSD/shared/ui/back-button/BackButton";
import { ButtonIcon } from "@/FSD/shared/ui/button-icon/ButtonIcon";
import { NumberInput } from "@/FSD/shared/ui/input/NumberInput";
import { TextInput } from "@/FSD/shared/ui/input/TextInput";
import { NumberInputType } from "@/FSD/shared/ui/input/types";

const PLAYER_SLOTS = 2;

export type CreateRoomDraft = Readonly<{
  name: string;
  config: DotsGameConfig;
  password: string;
}>;

export type DotsOnlineRoomSetupProps = Readonly<{
  /** When `null`, the form is in "draft" mode: clicking the primary button creates the room. */
  roomId: string | null;
  userId: string;
  /** True while the parent's create-room mutation is in flight (draft mode only). */
  isCreating?: boolean;
  onBack: () => void;
  onGameStarted: (roomId: string) => void;
  onLeftRoom: () => void;
  onCreateRoom: (draft: CreateRoomDraft) => void;
}>;

type DraftFormState = Readonly<{
  name: string;
  rows: number | undefined;
  cols: number | undefined;
  password: string;
}>;

type GridFieldsProps = Readonly<{
  rows: number | undefined;
  cols: number | undefined;
  disabled: boolean;
  onRowsChange: (value: number | undefined) => void;
  onColsChange: (value: number | undefined) => void;
}>;

type DraftIdentityFieldsProps = Readonly<{
  name: string;
  password: string;
  onNameChange: (value: string) => void;
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
  isCreating: boolean;
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

/** Grid-size form block (rows + cols); shared between draft and in-room modes. */
function GridSizeFields(props: GridFieldsProps): ReactElement {
  const t = useTranslations("DotsGame");
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
    </div>
  );
}

/** Draft-only fields (room name + optional password); password emptiness flips privacy. */
function DraftIdentityFields(props: DraftIdentityFieldsProps): ReactElement {
  const t = useTranslations("DotsGame");
  return (
    <div className={styles.fields}>
      <label className={styles.fieldLabel}>
        <span>{t("roomNameLabel")}</span>
        <TextInput
          value={props.name}
          onChange={props.onNameChange}
          placeholder={t("roomNamePlaceholder")}
          isClearable
        />
      </label>
      <label className={styles.fieldLabel}>
        <span>{t("passwordOptional")}</span>
        <TextInput
          value={props.password}
          onChange={props.onPasswordChange}
          placeholder={t("passwordPlaceholder")}
          isPassword
          isClearable
        />
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
function DraftRoomSetupBody({
  draft,
  setDraft,
  defaults,
  isCreating,
  onBack,
  onCreate
}: DraftRoomSetupBodyProps): ReactElement {
  const t = useTranslations("DotsGame");
  const effectiveConfig = useMemo(
    () => buildEffectiveConfig({ rows: draft.rows, cols: draft.cols, defaults }),
    [draft.rows, draft.cols, defaults]
  );
  return (
    <div className={styles.setup}>
      <div className={styles.topBar}>
        <BackButton onClick={onBack} label={t("back")} />
        <h2 className={styles.title}>{t("createRoomTitle")}</h2>
        <span aria-hidden style={{ width: 1 }} />
      </div>
      <DraftIdentityFields
        name={draft.name}
        password={draft.password}
        onNameChange={(value) => setDraft({ ...draft, name: value })}
        onPasswordChange={(value) => setDraft({ ...draft, password: value })}
      />
      <GridSizeFields
        rows={draft.rows}
        cols={draft.cols}
        disabled={isCreating}
        onRowsChange={(value) => setDraft({ ...draft, rows: value })}
        onColsChange={(value) => setDraft({ ...draft, cols: value })}
      />
      <div className={styles.actions}>
        <DotsGameStartButton onClick={onCreate} isLoading={isCreating}>
          {t("createRoomAction")}
        </DotsGameStartButton>
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
        <BackButton onClick={props.onBack} label={t("back")} />
        <h2 className={styles.title}>{room.name}</h2>
        <button type="button" className={styles.changeNameButton} onClick={props.onLeave}>
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

type SubmitDraftArgs = Readonly<{
  draft: DraftFormState;
  defaults: DotsGameConfig;
  onCreateRoom: (draft: CreateRoomDraft) => void;
}>;

/** Clears any prior start error and fires the start-game mutation for the room owner. */
function requestStartGame({
  roomId,
  userId,
  setStartError,
  startGame
}: Readonly<{
  roomId: string;
  userId: string;
  setStartError: (value: string | null) => void;
  startGame: (args: Readonly<{ roomId: string; request: Readonly<{ byUserId: string }> }>) => void;
}>): void {
  setStartError(null);
  startGame({ roomId, request: { byUserId: userId } });
}

/** Builds the create-room payload from the draft form state and forwards it to the parent. */
function submitDraft(args: SubmitDraftArgs): void {
  const effectiveConfig = buildEffectiveConfig({
    rows: args.draft.rows,
    cols: args.draft.cols,
    defaults: args.defaults
  });
  args.onCreateRoom({
    name: args.draft.name,
    config: effectiveConfig,
    password: args.draft.password
  });
}

/** Online configuration view: in draft mode shows "Create room"; in in-room mode shows roster + "Start game". */
export function DotsOnlineRoomSetup(props: DotsOnlineRoomSetupProps): ReactElement {
  const defaults = useMemo(() => defaultDotsConfig(), []);
  const [draft, setDraft] = useState<DraftFormState>(() => ({
    name: "",
    rows: defaults.rows,
    cols: defaults.cols,
    password: ""
  }));
  const [startError, setStartError] = useState<string | null>(null);

  const { roomId, userId, isCreating = false, onBack, onGameStarted, onLeftRoom, onCreateRoom } = props;
  const live = useRoomLive(roomId);
  const { room } = live;

  const { mutate: updateRoom } = useUpdateRoomMutation();
  const { mutate: startGame, error: startMutationError, reset: resetStart } = useStartGameMutation();
  const { mutate: leaveRoom, isSuccess: didLeaveSucceed, reset: resetLeave } = useLeaveRoomMutation();

  useEffect(() => {
    if (roomId && room && room.status === "playing") {
      onGameStarted(room.id);
    }
  }, [roomId, room, onGameStarted]);

  useEffect(() => {
    if (startMutationError) {
      setStartError(startMutationError.message);
      resetStart();
    }
  }, [startMutationError, resetStart]);

  useEffect(() => {
    if (didLeaveSucceed) {
      onLeftRoom();
      resetLeave();
    }
  }, [didLeaveSucceed, onLeftRoom, resetLeave]);

  if (!roomId) {
    return (
      <DraftRoomSetupBody
        draft={draft}
        setDraft={setDraft}
        defaults={defaults}
        isCreating={isCreating}
        onBack={onBack}
        onCreate={() => submitDraft({ draft, defaults, onCreateRoom })}
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
      onStart={() => requestStartGame({ roomId: room.id, userId, setStartError, startGame })}
      onPatch={(patch) => updateRoom({ roomId: room.id, request: { byUserId: userId, ...patch } })}
      onKick={(kickUserId) => updateRoom({ roomId: room.id, request: { byUserId: userId, kickUserId } })}
      onLeave={() => leaveRoom({ roomId: room.id, request: { userId } })}
      startError={startError}
    />
  );
}
