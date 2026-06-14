"use client";

import type { MouseEvent as ReactMouseEvent, ReactElement, ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";

import type { UseDotsGameResult } from "../../model/useDotsGame";
import type { DotsGameConfig, DotsGameMode, GridPoint, PlayerId } from "../../model/types";

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
import { ButtonIcon } from "@/FSD/shared/ui/button-icon/ButtonIcon";
import { ToolbarButton } from "@/FSD/shared/ui/toolbar-button/ToolbarButton";

type DotsBoardT = (key: string, values?: Record<string, number>) => string;

type BoardTouchHandlers = Readonly<{
  mode: DotsGameMode;
  cellSizePx: number;
  rows: number;
  cols: number;
  placeLmb: UseDotsGameResult["placeLmb"];
  polygonClick: UseDotsGameResult["polygonClick"];
}>;

/** Registers the Escape key listener for undo when the board is interactive. */
function useEscapeUndo(isInteractive: boolean, undo: () => void): void {
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
}

/** Registers touch listeners on the board element for mobile input. */
function useBoardTouchInput(
  isInteractive: boolean,
  boardRef: RefObject<HTMLDivElement | null>,
  boardWrapRef: RefObject<HTMLDivElement | null>,
  handlers: BoardTouchHandlers
): void {
  const { mode, cellSizePx, rows, cols, placeLmb, polygonClick } = handlers;
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
      mode,
      cellSizePx,
      rows,
      cols,
      placeLmb,
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
  }, [boardRef, boardWrapRef, cellSizePx, cols, isInteractive, mode, placeLmb, polygonClick, rows]);
}

/** Builds dot keys for chain-path highlighting during polygon drawing. */
function buildChainPathDotKeys(mode: DotsGameMode, chainPath: readonly GridPoint[]): ReadonlySet<string> {
  const keys = new Set<string>();
  if (mode !== "drawPolygon") {
    return keys;
  }
  for (const point of chainPath) {
    keys.add(`d-${point.r}-${point.c}`);
  }
  return keys;
}

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
  isMyTurn: boolean;
  onAccept: () => void;
  onUndo?: () => void;
  onClear?: () => void;
  onExit?: () => void;
  exitDisabled?: boolean;
  onSurrender: () => void;
  hideAccept: boolean;
  hideSurrender: boolean;
  extraStatus?: ReactNode;
  onChatView?: () => void;
  hasUnreadChat?: boolean;
}>;

/** Scores, turn line, and action buttons (not shown in setup preview). */
function DotsBoardChrome({
  t,
  playerLabels,
  scores,
  turnLabel,
  mode,
  pendingDot,
  isMyTurn,
  onAccept,
  onUndo,
  onClear,
  onExit,
  exitDisabled = false,
  onSurrender,
  hideAccept,
  hideSurrender,
  extraStatus,
  onChatView,
  hasUnreadChat = false
}: DotsBoardChromeProps): ReactElement {
  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarMain}>
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
        {onChatView ? (
          <div className={styles.toolbarEnd}>
            <ButtonIcon
              iconName={hasUnreadChat ? "chatUnread" : "chat"}
              iconColor="#ef4444"
              background="ghost"
              title={t("chatToggleAria")}
              onClick={onChatView}
            />
          </div>
        ) : null}
      </div>
      <div className={styles.actions}>
        {hideAccept ? null : (
          <ToolbarButton onClick={onAccept} disabled={mode !== "play" || pendingDot === null || !isMyTurn}>
            {t("accept")}
          </ToolbarButton>
        )}
        {onUndo ? (
          <ToolbarButton onClick={onUndo} disabled={!isMyTurn}>
            {t("undo")}
          </ToolbarButton>
        ) : null}
        {onClear ? <ToolbarButton onClick={onClear}>{t("clear")}</ToolbarButton> : null}
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

/** Returns the winner overlay text, or null in preview mode. */
function formatWinnerOverlay(
  preview: boolean,
  t: ReturnType<typeof useTranslations>,
  winner: PlayerId | null,
  surrenderedBy: PlayerId | null,
  playerLabels: Readonly<Record<PlayerId, string>>
): string | null {
  if (preview) {
    return null;
  }
  return formatWinnerText(t, winner, surrenderedBy, playerLabels);
}

/** Wraper div classname */
function getWrapClassName(preview: boolean): string {
  return preview ? `${styles.wrap} ${styles.previewWrap}` : styles.wrap;
}

/** Board classname */
function getBoardClassName(preview: boolean): string {
  return preview ? `${styles.board} ${styles.boardPreview}` : styles.board;
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
  /** When set, a chat toggle button is shown in the toolbar. */
  onChatView?: () => void;
  /** Whether the chat toggle shows the unread icon variant. */
  hasUnreadChat?: boolean;
  /** Hide the Accept button (e.g. online flows that auto-commit). */
  hideAccept?: boolean;
  /** Hide the Surrender button (e.g. preview / viewer / hot-seat-keeps-it). */
  hideSurrender?: boolean;
  /** When false, Accept/Undo are disabled (online opponent's turn). Defaults to true. */
  isMyTurn?: boolean;
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
  onChatView,
  hasUnreadChat = false,
  hideAccept = false,
  hideSurrender = false,
  isMyTurn = true
}: DotsBoardViewProps): ReactElement {
  const t = useTranslations("DotsGame");
  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const { state, placeLmb, polygonClick, accept, undo, clear, surrender, currentPlayer } = game;
  const effectiveConfig = config ?? state.config;
  const { cellSizePx, rows, cols } = effectiveConfig;
  const { cells, scores, mode, chainPath, polygons, winner, surrenderedBy, pendingDot } = state;
  const width = (cols - 1) * cellSizePx;
  const height = (rows - 1) * cellSizePx;
  const isInteractive = !preview && !readOnly;

  useEscapeUndo(isInteractive && isMyTurn, undo);

  useBoardTouchInput(isInteractive, boardRef, boardWrapRef, {
    mode: state.mode,
    cellSizePx,
    rows,
    cols,
    placeLmb,
    polygonClick
  });

  const currentPlayerName = playerLabels[currentPlayer];
  const turnLabel = formatTurnLabel(t, mode, currentPlayerName);
  const winnerText = formatWinnerOverlay(preview, t, winner, surrenderedBy, playerLabels);

  const gridLinesData = useMemo(
    () => buildGridLinesData({ rows, cols, cellSizePx, width, height }),
    [rows, cols, cellSizePx, width, height]
  );

  const polygonData = useMemo(() => buildPolygonData(polygons, cellSizePx), [polygons, cellSizePx]);

  const previewPoints = useMemo(() => buildPreviewPoints(mode, chainPath, cellSizePx), [mode, chainPath, cellSizePx]);

  const dotData = useMemo(() => buildDotData(cells, cellSizePx), [cells, cellSizePx]);

  const dotClassMap: DotClassMap = { p0: styles.dotP0, p1: styles.dotP1, blockedEmpty: styles.dotBlockedEmpty };
  const pendingDotKey = pendingDot ? `d-${pendingDot.r}-${pendingDot.c}` : null;
  const chainPathDotKeys = useMemo(() => buildChainPathDotKeys(mode, chainPath), [mode, chainPath]);
  const previewStroke = previewStrokeForChain(mode, state.chainStart, state.cells);

  return (
    <div className={getWrapClassName(preview)}>
      {preview ? null : (
        <DotsBoardChrome
          t={t}
          playerLabels={playerLabels}
          scores={scores}
          turnLabel={turnLabel}
          mode={state.mode}
          pendingDot={pendingDot}
          isMyTurn={isMyTurn}
          onAccept={accept}
          onUndo={readOnly ? undefined : undo}
          onClear={readOnly ? undefined : clear}
          onExit={onExit}
          exitDisabled={exitDisabled}
          onSurrender={surrender}
          hideAccept={hideAccept || readOnly}
          hideSurrender={hideSurrender || readOnly}
          extraStatus={extraStatus}
          onChatView={onChatView}
          hasUnreadChat={hasUnreadChat}
        />
      )}
      <div ref={boardWrapRef} className={styles.boardWrap}>
        <div
          ref={boardRef}
          className={getBoardClassName(preview)}
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
