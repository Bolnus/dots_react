"use client";

import type { MouseEvent as ReactMouseEvent, ReactElement } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";

import { useDotsGame } from "../model/useDotsGame";
import type { DotsGameConfig, DotsGameMode, GridPoint, PlayerId } from "../model/types";

import styles from "./DotsGamePlay.module.css";
import { ExpandableEllipsisText } from "@/FSD/shared/ui/expandable-ellipsis-text/ExpandableEllipsisText";
import { ToolbarButton } from "@/FSD/shared/ui/toolbar-button/ToolbarButton";
import {
  buildDotData,
  buildGridLinesData,
  buildPolygonData,
  buildPreviewPoints,
  dotClassFor,
  formatTurnLabel,
  formatWinnerText,
  handleBoardMouseDown,
  handleEscapeKey,
  onBoardTouchEndPreventDefault,
  onBoardTouchMove,
  onBoardTouchStartPreventDefault,
  previewStrokeForChain
} from "./DotsGameUtils";
import type { DotClassMap, MutablePoint } from "./DotsGameTypes";

type DotsGamePlayProps = Readonly<{
  config: DotsGameConfig;
  playerLabels: Readonly<Record<PlayerId, string>>;
  /** When set, exit is shown in the toolbar (ignored in `preview` mode). */
  onExit?: () => void;
  /** Empty board only: no toolbar, no input, for setup preview. */
  preview?: boolean;
}>;

type DotsGameT = (key: string, values?: Record<string, number>) => string;

type BoardLine = Readonly<{ key: string; x1: number; y1: number; x2: number; y2: number }>;
type BoardPoly = Readonly<{ key: string; points: string; fill: string }>;

type DotsGamePlayBoardLayersProps = Readonly<{
  width: number;
  height: number;
  t: DotsGameT;
  gridLinesData: readonly BoardLine[];
  polygonData: readonly BoardPoly[];
  previewPoints: string | null;
  previewStroke: string;
  dotData: ReturnType<typeof buildDotData>;
  dotClassMap: DotClassMap;
  pendingDotKey: string | null;
  chainPathDotKeys: ReadonlySet<string>;
}>;

/** Renders the board SVG (grid, fills, chain preview) and the absolutely positioned dots layer. */
function DotsGamePlayBoardLayers({
  width,
  height,
  t,
  gridLinesData,
  polygonData,
  previewPoints,
  previewStroke,
  dotData,
  dotClassMap,
  pendingDotKey,
  chainPathDotKeys
}: DotsGamePlayBoardLayersProps): ReactElement {
  return (
    <>
      <svg className={styles.gridSvg} width={width} height={height} role="img" aria-label={t("boardAria")}>
        <title>{t("boardAria")}</title>
        {gridLinesData.map((l) => (
          <line
            key={l.key}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="var(--dots-grid)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {polygonData.map((p) => (
          <polygon key={p.key} points={p.points} fill={p.fill} fillOpacity={0.22} stroke={p.fill} strokeWidth={2} />
        ))}
        {previewPoints ? (
          <polyline fill="none" stroke={previewStroke} strokeWidth={2} strokeDasharray="6 4" points={previewPoints} />
        ) : null}
      </svg>
      <div className={styles.dotsLayer}>
        {dotData.map((d) => (
          <div
            key={d.key}
            className={`${styles.dot} ${dotClassFor(d.owner, d.blocked, dotClassMap)}${
              (pendingDotKey !== null && d.key === pendingDotKey) || chainPathDotKeys.has(d.key)
                ? ` ${styles.dotPending}`
                : ""
            }`}
            style={{ left: d.left, top: d.top }}
          />
        ))}
      </div>
    </>
  );
}

type DotsGamePlayChromeProps = Readonly<{
  t: DotsGameT;
  playerLabels: Readonly<Record<PlayerId, string>>;
  scores: Readonly<Record<PlayerId, number>>;
  turnLabel: string;
  mode: DotsGameMode;
  pendingDot: GridPoint | null;
  onAccept: () => void;
  onUndo: () => void;
  onExit?: () => void;
  onSurrender: () => void;
}>;

/** Scores, turn line, and action buttons (not shown in setup preview). */
function DotsGamePlayChrome({
  t,
  playerLabels,
  scores,
  turnLabel,
  mode,
  pendingDot,
  onAccept,
  onUndo,
  onExit,
  onSurrender
}: DotsGamePlayChromeProps): ReactElement {
  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.scores}>
          <span className={styles.scoreP0}>
            {playerLabels.player0}: {scores.player0}
          </span>
          <span className={styles.scoreP1}>
            {playerLabels.player1}: {scores.player1}
          </span>
        </div>
        <div className={styles.turnSlot}>
          <ExpandableEllipsisText
            className={styles.turnLine}
            prefix={t("statusLabel")}
            text={turnLabel}
            toggleAriaLabel={t("turnLineToggleAria")}
          />
        </div>
      </div>
      <div className={styles.actions}>
        <ToolbarButton onClick={onAccept} disabled={mode !== "play" || pendingDot === null}>
          {t("accept")}
        </ToolbarButton>
        <ToolbarButton onClick={onUndo}>{t("undo")}</ToolbarButton>
        {onExit ? <ToolbarButton onClick={onExit}>{t("exit")}</ToolbarButton> : null}
        <ToolbarButton onClick={onSurrender} disabled={mode === "ended"}>
          {t("surrender")}
        </ToolbarButton>
      </div>
    </>
  );
}

/** In-game board, scoring, and actions (stage 2). Optional `preview` renders a static empty grid. */
export function DotsGamePlay({ config, playerLabels, onExit, preview = false }: DotsGamePlayProps): ReactElement {
  const t = useTranslations("DotsGame");
  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const { state, placeLmb, placeRmb, polygonClick, accept, undo, surrender, currentPlayer } = useDotsGame(config);
  const { cells, scores, mode, chainPath, polygons, winner, surrenderedBy, pendingDot } = state;
  const { cellSizePx, rows, cols } = state.config;
  const width = (cols - 1) * cellSizePx;
  const height = (rows - 1) * cellSizePx;

  useEffect(() => {
    if (preview) {
      return undefined;
    }
    const onKey = (e: KeyboardEvent): void => handleEscapeKey(e, undo);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [preview, undo]);

  useEffect(() => {
    if (preview) {
      return undefined;
    }
    const boardEl = boardRef.current;
    const wrapEl = boardWrapRef.current;
    if (!boardEl || !wrapEl) {
      return undefined;
    }

    const tapStart: MutablePoint = { x: null, y: null };
    const lastMid: MutablePoint = { x: null, y: null };
    const didTwoFingerScroll = { value: false };

    const getBoardDownArgs = (clientX: number, clientY: number) => ({
      clientX,
      clientY,
      boardEl,
      mode: state.mode,
      cellSizePx,
      rows,
      cols,
      isRmb: false,
      placeLmb,
      placeRmb,
      polygonClick
    });

    const onTouchStart = (e: TouchEvent): void =>
      onBoardTouchStartPreventDefault({ tapStart, lastMid, didTwoFingerScroll }, e);
    const onTouchMove = (e: TouchEvent): void => onBoardTouchMove({ wrapEl, tapStart, lastMid, didTwoFingerScroll }, e);
    const onTouchEnd = (e: TouchEvent): void =>
      onBoardTouchEndPreventDefault({ tapStart, lastMid, didTwoFingerScroll, getBoardDownArgs }, e);

    boardEl.addEventListener("touchstart", onTouchStart, { passive: false });
    boardEl.addEventListener("touchmove", onTouchMove, { passive: false });
    boardEl.addEventListener("touchend", onTouchEnd, { passive: false });
    boardEl.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      boardEl.removeEventListener("touchstart", onTouchStart);
      boardEl.removeEventListener("touchmove", onTouchMove);
      boardEl.removeEventListener("touchend", onTouchEnd);
      boardEl.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [cellSizePx, cols, placeLmb, placeRmb, polygonClick, preview, rows, state.mode]);

  const currentPlayerName = playerLabels[currentPlayer];
  const turnLabel = formatTurnLabel(t, mode, currentPlayerName);
  const winnerText = preview ? null : formatWinnerText(t, winner, surrenderedBy, playerLabels);

  const gridLinesData = useMemo(
    () => buildGridLinesData({ rows, cols, cellSizePx, width, height }),
    [rows, cols, cellSizePx, width, height]
  );

  const polygonData = useMemo(() => buildPolygonData(polygons, cellSizePx), [polygons, cellSizePx]);

  const previewPoints = useMemo(() => buildPreviewPoints(mode, chainPath, cellSizePx), [mode, chainPath, cellSizePx]);

  const dotData = useMemo(() => buildDotData(cells, cellSizePx), [cells, cellSizePx]);

  const dotClassMap: DotClassMap = { p0: styles.dotP0, p1: styles.dotP1, blockedEmpty: styles.dotBlockedEmpty };
  const pendingDotKey = pendingDot ? `d-${pendingDot.r}-${pendingDot.c}` : null;
  const chainPathDotKeys = useMemo(() => {
    const keys = new Set<string>();
    if (mode !== "drawPolygon") {
      return keys;
    }
    for (const p of chainPath) {
      keys.add(`d-${p.r}-${p.c}`);
    }
    return keys;
  }, [mode, chainPath]);
  const previewStroke = previewStrokeForChain(mode, state.chainStart, state.cells);

  const wrapClassName = preview ? `${styles.wrap} ${styles.previewWrap}` : styles.wrap;
  const boardClassName = preview ? `${styles.board} ${styles.boardPreview}` : styles.board;

  return (
    <div className={wrapClassName}>
      {preview ? null : (
        <DotsGamePlayChrome
          t={t}
          playerLabels={playerLabels}
          scores={scores}
          turnLabel={turnLabel}
          mode={state.mode}
          pendingDot={pendingDot}
          onAccept={accept}
          onUndo={undo}
          onExit={onExit}
          onSurrender={surrender}
        />
      )}
      <div ref={boardWrapRef} className={styles.boardWrap}>
        <div
          ref={boardRef}
          className={boardClassName}
          style={{ width, height }}
          onMouseDown={
            preview === true
              ? undefined
              : (e: ReactMouseEvent<HTMLDivElement>) =>
                  handleBoardMouseDown(e, boardRef, {
                    mode: state.mode,
                    cellSizePx,
                    rows,
                    cols,
                    placeLmb,
                    placeRmb,
                    polygonClick
                  })
          }
          onContextMenu={preview === true ? undefined : (e: ReactMouseEvent<HTMLDivElement>) => e.preventDefault()}
        >
          <DotsGamePlayBoardLayers
            width={width}
            height={height}
            t={t}
            gridLinesData={gridLinesData}
            polygonData={polygonData}
            previewPoints={previewPoints}
            previewStroke={previewStroke}
            dotData={dotData}
            dotClassMap={dotClassMap}
            pendingDotKey={pendingDotKey}
            chainPathDotKeys={chainPathDotKeys}
          />
        </div>
      </div>
      {winnerText ? <div className={styles.overlay}>{winnerText}</div> : null}
    </div>
  );
}
