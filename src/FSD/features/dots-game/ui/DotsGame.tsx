"use client";

import { useMemo, useState, type Dispatch, type ReactElement, type SetStateAction } from "react";
import { useTranslations } from "next-intl";

import { defaultDotsConfig } from "../model/logic";
import type { DotsGameConfig, PlayerId } from "../model/types";

import styles from "./DotsGame.module.css";
import { DotsGameBackLink } from "./DotsGameBackLink";
import { DotsGamePlay } from "./DotsGamePlay";
import { NumberInput } from "@/FSD/shared/ui/input/NumberInput";
import { NumberInputType } from "@/FSD/shared/ui/input/types";
import { ToolbarButton } from "@/FSD/shared/ui/toolbar-button/ToolbarButton";

const GRID_MIN = 3;
const GRID_MAX = 60;

type Session = Readonly<{
  key: number;
  config: DotsGameConfig;
  labels: Readonly<Record<PlayerId, string>>;
}>;

type StartDotsGameSessionArgs = Readonly<{
  rows: number | undefined;
  cols: number | undefined;
  name0: string;
  name1: string;
  cellSizePx: number;
  t: (key: string, values?: Record<string, number>) => string;
  setSetupError: Dispatch<SetStateAction<string | null>>;
  setSession: Dispatch<SetStateAction<Session | null>>;
}>;

/** Validates grid setup and starts a session with the chosen config and labels. */
function startDotsGameSession(args: StartDotsGameSessionArgs): void {
  const { rows, cols, name0, name1, cellSizePx, t, setSetupError, setSession } = args;
  if (
    rows === undefined ||
    cols === undefined ||
    !Number.isFinite(rows) ||
    !Number.isFinite(cols) ||
    !Number.isInteger(rows) ||
    !Number.isInteger(cols) ||
    rows < GRID_MIN ||
    rows > GRID_MAX ||
    cols < GRID_MIN ||
    cols > GRID_MAX
  ) {
    setSetupError(t("invalidGridSize", { min: GRID_MIN, max: GRID_MAX }));
    return;
  }
  setSetupError(null);
  const config: DotsGameConfig = { rows, cols, cellSizePx };
  const labels: Record<PlayerId, string> = {
    player0: name0.trim() || t("player0"),
    player1: name1.trim() || t("player1")
  };
  setSession({ key: Date.now(), config, labels });
}

/** Dots (polygon capture): setup (stage 1) then board (stage 2). */
export function DotsGame(): ReactElement {
  const t = useTranslations("DotsGame");
  const defaults = useMemo(() => defaultDotsConfig(), []);
  const [rows, setRows] = useState<number | undefined>(() => defaults.rows);
  const [cols, setCols] = useState<number | undefined>(() => defaults.cols);
  const [name0, setName0] = useState("");
  const [name1, setName1] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  if (session) {
    return <DotsGamePlay key={session.key} config={session.config} playerLabels={session.labels} />;
  }

  return (
    <div className={styles.setup}>
      <div className={styles.setupBack}>
        <DotsGameBackLink />
      </div>
      <p className={styles.hint}>{t("rulesShort")}</p>
      <div className={styles.setupFields}>
        <label className={styles.setupLabel}>
          <span>{t("rowsLabel")}</span>
          <NumberInput type={NumberInputType.Unsigned} value={rows} min={GRID_MIN} max={GRID_MAX} onChange={setRows} />
        </label>
        <label className={styles.setupLabel}>
          <span>{t("colsLabel")}</span>
          <NumberInput type={NumberInputType.Unsigned} value={cols} min={GRID_MIN} max={GRID_MAX} onChange={setCols} />
        </label>
        <label className={styles.setupLabel}>
          <span>{t("playerName0")}</span>
          <input
            className={styles.setupInput}
            type="text"
            autoComplete="off"
            value={name0}
            onChange={(e) => setName0(e.target.value)}
            placeholder={t("player0")}
          />
        </label>
        <label className={styles.setupLabel}>
          <span>{t("playerName1")}</span>
          <input
            className={styles.setupInput}
            type="text"
            autoComplete="off"
            value={name1}
            onChange={(e) => setName1(e.target.value)}
            placeholder={t("player1")}
          />
        </label>
      </div>
      {setupError ? <p className={styles.setupError}>{setupError}</p> : null}
      <div className={styles.setupActions}>
        <ToolbarButton
          onClick={() =>
            startDotsGameSession({
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
        </ToolbarButton>
      </div>
    </div>
  );
}
