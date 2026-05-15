"use client";

import type { MouseEvent as ReactMouseEvent, ReactElement, ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";

import type { UseDotsGameResult } from "../model/useDotsGame";
import type { DotsGameConfig, DotsGameMode, GridPoint, PlayerId } from "../model/types";

import type { DotClassMap, MutablePoint } from "./DotsGameTypes";
import styles from "./DotsGamePlay.module.css";
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
import { ExpandableEllipsisText } from "@/FSD/shared/ui/expandable-ellipsis-text/ExpandableEllipsisText";
import { ToolbarButton } from "@/FSD/shared/ui/toolbar-button/ToolbarButton";

type DotsBoardT = (key: string, values?: Record<string, number>) => string;

type BoardLine = Readonly<{ key: string; x1: number; y1: number; x2: number; y2: number }>;
type BoardPoly = Readonly<{ key: string; points: string; fill: string }>;

type DotsBoardBoardLayersProps = Readonly<{
  width: number;
  height: number;
  t: DotsBoardT;
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
function DotsBoardLayers({
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
}: DotsBoardBoardLayersProps): ReactElement {
  return (
    <>
      <svg className={styles.gridSvg} width={width} height={height} role="img" aria-label={t("boardAria")}>
        <title>{t("boardAria")}</title>
        {gridLinesData.map((line) => (
          <line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="var(--dots-grid)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {polygonData.map((poly) => (
          <polygon
            key={poly.key}
            points={poly.points}
            fill={poly.fill}
            fillOpacity={0.22}
            stroke={poly.fill}
            strokeWidth={2}
          />
        ))}
        {previewPoints ? (
          <polyline fill="none" stroke={previewStroke} strokeWidth={2} strokeDasharray="6 4" points={previewPoints} />
        ) : null}
      </svg>
      <div className={styles.dotsLayer}>
        {dotData.map((dot) => (
          <div
            key={dot.key}
            className={`${styles.dot} ${dotClassFor(dot.owner, dot.blocked, dotClassMap)}${
              (pendingDotKey !== null && dot.key === pendingDotKey) || chainPathDotKeys.has(dot.key)
                ? ` ${styles.dotPending}`
                : ""
            }`}
            style={{ left: dot.left, top: dot.top }}
          />
        ))}
      </div>
    </>
  );
}

type DotsBoardChromeProps = Readonly<{
  t: DotsBoardT;
  playerLabels: Readonly<Record<PlayerId, string>>;
  scores: Readonly<Record<PlayerId, number>>;
  turnLabel: string;
  mode: DotsGameMode;
  pendingDot: GridPoint | null;
  onAccept: () => void;
  onUndo: () => void;
  onExit?: () => void;
  exitDisabled?: boolean;
  onSurrender: () => void;
  hideAccept: boolean;
  hideSurrender: boolean;
  extraStatus?: ReactNode;
}>;

/** Scores, turn line, and action buttons (not shown in setup preview). */
function DotsBoardChrome({
  t,
  playerLabels,
  scores,
  turnLabel,
  mode,
  pendingDot,
  onAccept,
  onUndo,
  onExit,
  exitDisabled = false,
  onSurrender,
  hideAccept,
  hideSurrender,
  extraStatus
}: DotsBoardChromeProps): ReactElement {
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
        {extraStatus}
      </div>
      <div className={styles.actions}>
        {hideAccept ? null : (
          <ToolbarButton onClick={onAccept} disabled={mode !== "play" || pendingDot === null}>
            {t("accept")}
          </ToolbarButton>
        )}
        <ToolbarButton onClick={onUndo}>{t("undo")}</ToolbarButton>
        {onExit ? (
          <ToolbarButton onClick={onExit} disabled={exitDisabled}>
            {t("exit")}
          </ToolbarButton>
        ) : null}
        {hideSurrender ? null : (
          <ToolbarButton onClick={onSurrender} disabled={mode === "ended"}>
            {t("surrender")}
          </ToolbarButton>
        )}
      </div>
    </>
  );
}

export type DotsBoardViewProps = Readonly<{
  /** Optional explicit config; falls back to `game.state.config`. */
  config?: DotsGameConfig;
  playerLabels: Readonly<Record<PlayerId, string>>;
  game: UseDotsGameResult;
  /** When set, exit is shown in the toolbar (ignored in `preview` mode). */
  onExit?: () => void;
  /** Disables the exit button (e.g. while the parent's leave mutation is pending). */
  exitDisabled?: boolean;
  /** Empty board only: no toolbar, no input, for setup preview. */
  preview?: boolean;
  /** When true, board input + chrome buttons are disabled (used for viewer mode). */
  readOnly?: boolean;
  /** Optional status node injected to the right of the toolbar (viewer badge etc.). */
  extraStatus?: ReactNode;
  /** Hide the Accept button (e.g. online flows that auto-commit). */
  hideAccept?: boolean;
  /** Hide the Surrender button (e.g. preview / viewer / hot-seat-keeps-it). */
  hideSurrender?: boolean;
}>;

/** Shared in-game board, scoring, and actions; takes the game state via the `game` prop. */
export function DotsBoardView({
  config,
  playerLabels,
  game,
  onExit,
  exitDisabled = false,
  preview = false,
  readOnly = false,
  extraStatus,
  hideAccept = false,
  hideSurrender = false
}: DotsBoardViewProps): ReactElement {
  const t = useTranslations("DotsGame");
  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const { state, placeLmb, placeRmb, polygonClick, accept, undo, surrender, currentPlayer } = game;
  const effectiveConfig = config ?? state.config;
  const { cellSizePx, rows, cols } = effectiveConfig;
  const { cells, scores, mode, chainPath, polygons, winner, surrenderedBy, pendingDot } = state;
  const width = (cols - 1) * cellSizePx;
  const height = (rows - 1) * cellSizePx;
  const isInteractive = !preview && !readOnly;

  useEffect(() => {
    if (!isInteractive) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent): void => handleEscapeKey(event, undo);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [isInteractive, undo]);

  useEffect(() => {
    if (!isInteractive) {
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

    const onTouchStart = (event: TouchEvent): void =>
      onBoardTouchStartPreventDefault({ tapStart, lastMid, didTwoFingerScroll }, event);
    const onTouchMove = (event: TouchEvent): void =>
      onBoardTouchMove({ wrapEl, tapStart, lastMid, didTwoFingerScroll }, event);
    const onTouchEnd = (event: TouchEvent): void =>
      onBoardTouchEndPreventDefault({ tapStart, lastMid, didTwoFingerScroll, getBoardDownArgs }, event);

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
  }, [cellSizePx, cols, isInteractive, placeLmb, placeRmb, polygonClick, rows, state.mode]);

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
    for (const point of chainPath) {
      keys.add(`d-${point.r}-${point.c}`);
    }
    return keys;
  }, [mode, chainPath]);
  const previewStroke = previewStrokeForChain(mode, state.chainStart, state.cells);

  const wrapClassName = preview ? `${styles.wrap} ${styles.previewWrap}` : styles.wrap;
  const boardClassName = preview ? `${styles.board} ${styles.boardPreview}` : styles.board;

  return (
    <div className={wrapClassName}>
      {preview ? null : (
        <DotsBoardChrome
          t={t}
          playerLabels={playerLabels}
          scores={scores}
          turnLabel={turnLabel}
          mode={state.mode}
          pendingDot={pendingDot}
          onAccept={accept}
          onUndo={undo}
          onExit={onExit}
          exitDisabled={exitDisabled}
          onSurrender={surrender}
          hideAccept={hideAccept || readOnly}
          hideSurrender={hideSurrender || readOnly}
          extraStatus={extraStatus}
        />
      )}
      <div ref={boardWrapRef} className={styles.boardWrap}>
        <div
          ref={boardRef}
          className={boardClassName}
          style={{ width, height }}
          onMouseDown={
            isInteractive
              ? (event: ReactMouseEvent<HTMLDivElement>) =>
                  handleBoardMouseDown(event, boardRef, {
                    mode: state.mode,
                    cellSizePx,
                    rows,
                    cols,
                    placeLmb,
                    placeRmb,
                    polygonClick
                  })
              : undefined
          }
          onContextMenu={isInteractive ? (event: ReactMouseEvent<HTMLDivElement>) => event.preventDefault() : undefined}
        >
          <DotsBoardLayers
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
