"use client";

import { useMemo, useState, type Dispatch, type ReactElement, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

import { DOTS_GRID_MAX, DOTS_GRID_MIN } from "../model/consts";
import { defaultDotsConfig, isValidGridDimension } from "../model/logic";
import type { DotsGameConfig, PlayerId } from "../model/types";

import { DotsGameBackButton } from "./DotsGameBackButton";
import { DotsGamePlay } from "./DotsGamePlay";
import { DotsGameStartButton } from "./DotsGameStartButton";
import styles from "./DotsHotSeatSetup.module.css";
import { LocalStorageKey } from "@/FSD/shared/lib/local-storage/localStorageKey";
import { NumberInput } from "@/FSD/shared/ui/input/NumberInput";
import { TextInput } from "@/FSD/shared/ui/input/TextInput";
import { NumberInputType } from "@/FSD/shared/ui/input/types";

type Session = Readonly<{
  key: number;
  config: DotsGameConfig;
  labels: Readonly<Record<PlayerId, string>>;
}>;

type StartDotsHotSeatSessionArgs = Readonly<{
  rows: number | undefined;
  cols: number | undefined;
  name0: string;
  name1: string;
  cellSizePx: number;
  t: (key: string, values?: Record<string, number>) => string;
  setSetupError: Dispatch<SetStateAction<string | null>>;
  setSession: Dispatch<SetStateAction<Session | null>>;
}>;

export type DotsHotSeatSetupProps = Readonly<{
  onBack: () => void;
}>;

/** Validates grid setup and starts a hot-seat session with the chosen config and labels. */
function startDotsHotSeatSession(args: StartDotsHotSeatSessionArgs): void {
  const { rows, cols, name0, name1, cellSizePx, t, setSetupError, setSession } = args;
  if (!isValidGridDimension(rows) || !isValidGridDimension(cols)) {
    setSetupError(t("invalidGridSize", { min: DOTS_GRID_MIN, max: DOTS_GRID_MAX }));
    return;
  }
  setSetupError(null);
  const config: DotsGameConfig = { rows, cols, cellSizePx };
  const labels: Record<PlayerId, string> = {
    player0: name0.trim() || t("player0"),
    player1: name1.trim() || t("player1")
  };
  setSession({ key: Date.now(), config, labels });
  try {
    localStorage.setItem(LocalStorageKey.DotsGameDefaultRows, String(rows));
    localStorage.setItem(LocalStorageKey.DotsGameDefaultCols, String(cols));
  } catch {
    /* Quota / private mode: ignore */
  }
}

/** Hot-seat dots setup view: grid + player names + Start; back returns to the lobby. */
export function DotsHotSeatSetup({ onBack }: DotsHotSeatSetupProps): ReactElement | null {
  const t = useTranslations("DotsGame");
  const defaults = useMemo(() => defaultDotsConfig(), []);
  const [rows, setRows] = useState<number | undefined>(() => defaults.rows);
  const [cols, setCols] = useState<number | undefined>(() => defaults.cols);
  const [name0, setName0] = useState("");
  const [name1, setName1] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const previewConfig = useMemo((): DotsGameConfig => {
    return {
      rows: isValidGridDimension(rows) ? rows : defaults.rows,
      cols: isValidGridDimension(cols) ? cols : defaults.cols,
      cellSizePx: defaults.cellSizePx
    };
  }, [rows, cols, defaults]);

  const previewLabels = useMemo(
    (): Readonly<Record<PlayerId, string>> => ({
      player0: name0.trim() || t("player0"),
      player1: name1.trim() || t("player1")
    }),
    [name0, name1, t]
  );

  if (session) {
    const play = (
      <DotsGamePlay
        key={session.key}
        config={session.config}
        playerLabels={session.labels}
        onExit={() => setSession(null)}
      />
    );
    if (typeof document === "undefined") {
      return play;
    }
    return createPortal(<div className={styles.playPortalRoot}>{play}</div>, document.body);
  }

  return (
    <div className={styles.setup}>
      <div className={styles.setupBack}>
        <DotsGameBackButton onClick={onBack} label={t("back")} />
      </div>
      <p className={styles.hint}>{t("rulesShort")}</p>
      <div className={styles.setupFields}>
        <label className={styles.setupLabel}>
          <span>{t("rowsLabel")}</span>
          <NumberInput
            type={NumberInputType.Unsigned}
            value={rows}
            min={DOTS_GRID_MIN}
            max={DOTS_GRID_MAX}
            onChange={setRows}
          />
        </label>
        <label className={styles.setupLabel}>
          <span>{t("colsLabel")}</span>
          <NumberInput
            type={NumberInputType.Unsigned}
            value={cols}
            min={DOTS_GRID_MIN}
            max={DOTS_GRID_MAX}
            onChange={setCols}
          />
        </label>
        <label className={styles.setupLabel}>
          <span>{t("playerName0")}</span>
          <TextInput value={name0} onChange={setName0} placeholder={t("player0")} isClearable />
        </label>
        <label className={styles.setupLabel}>
          <span>{t("playerName1")}</span>
          <TextInput value={name1} onChange={setName1} placeholder={t("player1")} isClearable />
        </label>
      </div>
      {setupError ? <p className={styles.setupError}>{setupError}</p> : null}
      <div className={styles.setupActions}>
        <DotsGameStartButton
          onClick={() =>
            startDotsHotSeatSession({
              rows,
              cols,
              name0,
              name1,
              cellSizePx: defaults.cellSizePx,
              t,
              setSetupError,
              setSession
            })
          }
        >
          {t("startGame")}
        </DotsGameStartButton>
      </div>
      <div className={styles.setupPreview}>
        <DotsGamePlay
          key={`preview-${previewConfig.rows}x${previewConfig.cols}`}
          config={previewConfig}
          playerLabels={previewLabels}
          preview
        />
      </div>
    </div>
  );
}
