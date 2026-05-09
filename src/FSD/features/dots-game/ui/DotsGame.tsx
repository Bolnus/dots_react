"use client";

import type { ReactElement, RefObject } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";

import { useDotsGame } from "../model/useDotsGame";
import type { CellState, FilledPolygon, GridPoint, PlayerId } from "../model/types";

import styles from "./DotsGame.module.css";

type HitTestArgs = Readonly<{
  clientX: number;
  clientY: number;
  el: HTMLElement;
  cellSize: number;
  rows: number;
  cols: number;
}>;

/** Maps a pointer location to the nearest grid intersection. */
function hitTestGrid(args: HitTestArgs): GridPoint | null {
  const { clientX, clientY, el, cellSize, rows, cols } = args;
  const rect = el.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const c = Math.round(x / cellSize);
  const r = Math.round(y / cellSize);
  if (r < 0 || c < 0 || r >= rows || c >= cols) {
    return null;
  }
  return { r, c };
}

/** Selects a dot CSS class based on ownership / blocked status. */
function dotClassForCell(cell: CellState): string {
  if (cell.owner === "player0") {
    return styles.dotP0;
  }
  if (cell.owner === "player1") {
    return styles.dotP1;
  }
  return styles.dotBlockedEmpty;
}

/** Stable key for a polygon based on its ring vertices. */
function polygonDomKey(ring: readonly GridPoint[]): string {
  return ring.map((p) => `${p.r}x${p.c}`).join("-");
}

type BoardPointerHandlers = Readonly<{
  mode: "play" | "drawPolygon" | "ended";
  cellSizePx: number;
  rows: number;
  cols: number;
  placeLmb: (p: GridPoint) => void;
  placeRmb: (p: GridPoint) => void;
  polygonClick: (p: GridPoint) => void;
}>;

/** Handles LMB/RMB click semantics for placing and enclosure tracing. */
function handleBoardMouseDown(
  e: React.MouseEvent<HTMLDivElement>,
  boardRef: RefObject<HTMLDivElement | null>,
  handlers: BoardPointerHandlers
): void {
  if (handlers.mode === "ended") {
    return;
  }
  const el = boardRef.current;
  if (!el) {
    return;
  }
  const p = hitTestGrid({
    clientX: e.clientX,
    clientY: e.clientY,
    el,
    cellSize: handlers.cellSizePx,
    rows: handlers.rows,
    cols: handlers.cols
  });
  if (!p) {
    return;
  }
  if (e.button === 2) {
    e.preventDefault();
    if (handlers.mode === "play") {
      handlers.placeRmb(p);
    }
    return;
  }
  if (e.button !== 0) {
    return;
  }
  if (handlers.mode === "drawPolygon") {
    handlers.polygonClick(p);
    return;
  }
  handlers.placeLmb(p);
}

type BoardDownArgs = Readonly<{
  clientX: number;
  clientY: number;
  boardEl: HTMLElement;
  mode: "play" | "drawPolygon" | "ended";
  cellSizePx: number;
  rows: number;
  cols: number;
  isRmb: boolean;
  placeLmb: (p: GridPoint) => void;
  placeRmb: (p: GridPoint) => void;
  polygonClick: (p: GridPoint) => void;
}>;

/** Runs a board action for a given client coordinate (mouse/touch). */
function handleBoardDown(args: BoardDownArgs): void {
  const { clientX, clientY, boardEl, mode, cellSizePx, rows, cols, isRmb, placeLmb, placeRmb, polygonClick } = args;
  if (mode === "ended") {
    return;
  }
  const p = hitTestGrid({ clientX, clientY, el: boardEl, cellSize: cellSizePx, rows, cols });
  if (!p) {
    return;
  }
  if (isRmb) {
    if (mode === "play") {
      placeRmb(p);
    }
    return;
  }
  if (mode === "drawPolygon") {
    polygonClick(p);
    return;
  }
  placeLmb(p);
}

type MutablePoint = { x: number | null; y: number | null };
type MutableBool = { value: boolean };

/** Writes the midpoint of two touches into `out` (stable reference). */
function touchMidpoint(a: Touch, b: Touch, out: MutablePoint): void {
  out.x = (a.clientX + b.clientX) / 2;
  out.y = (a.clientY + b.clientY) / 2;
}

/** Clears a mutable point by setting its coordinates to null. */
function clearPoint(p: MutablePoint): void {
  p.x = null;
  p.y = null;
}

/** True when both coordinates are present (non-null). */
function isPointSet(p: MutablePoint): p is { x: number; y: number } {
  return p.x !== null && p.y !== null;
}

type TouchStartCtx = Readonly<{
  tapStart: MutablePoint;
  lastMid: MutablePoint;
  didTwoFingerScroll: MutableBool;
}>;

type TouchMoveCtx = Readonly<{
  wrapEl: HTMLElement;
  tapStart: MutablePoint;
  lastMid: MutablePoint;
  didTwoFingerScroll: MutableBool;
  tapMoveThresholdPx: number;
}>;

type TouchEndCtx = Readonly<{
  tapStart: MutablePoint;
  lastMid: MutablePoint;
  didTwoFingerScroll: MutableBool;
  getBoardDownArgs: (clientX: number, clientY: number) => BoardDownArgs;
}>;

/** Tracks initial tap point or switches into two-finger scroll mode. */
function onBoardTouchStart(ctx: TouchStartCtx, e: TouchEvent): void {
  if (e.touches.length === 1) {
    ctx.tapStart.x = e.touches[0].clientX;
    ctx.tapStart.y = e.touches[0].clientY;
    ctx.didTwoFingerScroll.value = false;
  }
  if (e.touches.length === 2) {
    clearPoint(ctx.tapStart);
    ctx.didTwoFingerScroll.value = true;
    touchMidpoint(e.touches[0], e.touches[1], ctx.lastMid);
  }
}

/** Converts a two-finger drag into scrolling of the surrounding board wrapper. */
function onBoardTouchMove(ctx: TouchMoveCtx, e: TouchEvent): void {
  if (e.touches.length !== 2) {
    clearPoint(ctx.lastMid);
    if (isPointSet(ctx.tapStart) && e.touches.length === 1) {
      const dx = e.touches[0].clientX - ctx.tapStart.x;
      const dy = e.touches[0].clientY - ctx.tapStart.y;
      if (Math.hypot(dx, dy) > ctx.tapMoveThresholdPx) {
        clearPoint(ctx.tapStart);
      }
    } else if (e.touches.length !== 1) {
      clearPoint(ctx.tapStart);
    }
    return;
  }

  const mid: MutablePoint = { x: null, y: null };
  touchMidpoint(e.touches[0], e.touches[1], mid);
  if (!isPointSet(ctx.lastMid) || !isPointSet(mid)) {
    ctx.lastMid.x = mid.x;
    ctx.lastMid.y = mid.y;
    return;
  }

  e.preventDefault();
  clearPoint(ctx.tapStart);
  ctx.didTwoFingerScroll.value = true;

  const dx = mid.x - ctx.lastMid.x;
  const dy = mid.y - ctx.lastMid.y;
  ctx.wrapEl.scrollLeft -= dx;
  ctx.wrapEl.scrollTop -= dy;
  ctx.lastMid.x = mid.x;
  ctx.lastMid.y = mid.y;
}

/** Triggers a board tap only if no two-finger scroll was detected. */
function onBoardTouchEnd(ctx: TouchEndCtx, e: TouchEvent): void {
  if (isPointSet(ctx.tapStart) && !ctx.didTwoFingerScroll.value && e.changedTouches.length >= 1) {
    const [touch] = e.changedTouches;
    const args = ctx.getBoardDownArgs(touch.clientX, touch.clientY);
    handleBoardDown(args);
  }
  clearPoint(ctx.lastMid);
  clearPoint(ctx.tapStart);
}

/** Esc cancels polygon drawing / undoes the last step. */
function handleEscapeKey(e: KeyboardEvent, undo: () => void): void {
  if (e.key === "Escape") {
    undo();
  }
}

type BoardDims = Readonly<{
  rows: number;
  cols: number;
  cellSizePx: number;
  width: number;
  height: number;
}>;

type GridLineData = Readonly<{
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}>;

/** Produces grid lines as data so JSX can map them. */
function buildGridLinesData(dims: BoardDims): GridLineData[] {
  const { cols, rows, cellSizePx, width, height } = dims;
  const lines: GridLineData[] = [];
  for (let c = 0; c < cols; c++) {
    const x = c * cellSizePx;
    lines.push({ key: `v-${c}`, x1: x, y1: 0, x2: x, y2: height });
  }
  for (let r = 0; r < rows; r++) {
    const y = r * cellSizePx;
    lines.push({ key: `h-${r}`, x1: 0, y1: y, x2: width, y2: y });
  }
  return lines;
}

type PolygonData = Readonly<{
  key: string;
  points: string;
  fill: string;
}>;

/** Produces polygon fill/stroke data for mapping in JSX. */
function buildPolygonData(polygons: readonly FilledPolygon[], cellSizePx: number): PolygonData[] {
  return polygons.map((poly: FilledPolygon) => ({
    key: polygonDomKey(poly.ring),
    points: poly.ring.map((p: GridPoint) => `${p.c * cellSizePx},${p.r * cellSizePx}`).join(" "),
    fill: poly.owner === "player0" ? "var(--dots-p0)" : "var(--dots-p1)"
  }));
}

/** Produces the polyline points string for the currently traced chain (if any). */
function buildPreviewPoints(
  mode: "play" | "drawPolygon" | "ended",
  chainPath: readonly GridPoint[],
  cellSizePx: number
): string | null {
  if (mode !== "drawPolygon" || chainPath.length === 0) {
    return null;
  }
  return chainPath.map((p: GridPoint) => `${p.c * cellSizePx},${p.r * cellSizePx}`).join(" ");
}

type DotData = Readonly<{
  key: string;
  left: number;
  top: number;
  cls: string;
}>;

/** Produces dot layer divs as data for mapping in JSX. */
function buildDotData(cells: readonly CellState[][], cellSizePx: number): DotData[] {
  const dots: DotData[] = [];
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      const cell = cells[r][c];
      if (cell.owner === null && !cell.blocked) {
        continue;
      }
      const cls = dotClassForCell(cell);
      dots.push({ key: `d-${r}-${c}`, left: c * cellSizePx, top: r * cellSizePx, cls });
    }
  }
  return dots;
}

/** Formats the status label for the current mode. */
function formatTurnLabel(
  t: ReturnType<typeof useTranslations>,
  mode: "play" | "drawPolygon" | "ended",
  playerName: string
): string {
  if (mode === "drawPolygon") {
    return t("turnDrawing");
  }
  if (mode === "ended") {
    return t("turnEnded");
  }
  return t("turnPlace", { player: playerName });
}

/** Formats the winner overlay string, including surrender messaging. */
function formatWinnerText(
  t: ReturnType<typeof useTranslations>,
  winner: PlayerId | null,
  surrenderedBy: PlayerId | null
): string | null {
  if (winner === null) {
    return null;
  }
  const winnerName = winner === "player0" ? t("player0") : t("player1");
  if (surrenderedBy !== null) {
    return t("resultSurrender", { winner: winnerName });
  }
  return t("resultWin", { winner: winnerName });
}

/** Dots (polygon capture) board: LMB place, RMB start enclosure, trace cycle, Esc/Undo. */
export function DotsGame(): ReactElement {
  const t = useTranslations("DotsGame");
  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const { state, placeLmb, placeRmb, polygonClick, undo, clear, surrender, currentPlayer } = useDotsGame();
  const { config, cells, scores, mode, chainPath, polygons, winner, surrenderedBy } = state;
  const { cellSizePx, rows, cols } = config;
  const width = (cols - 1) * cellSizePx;
  const height = (rows - 1) * cellSizePx;
  // console.log(JSON.stringify(cells.filter((row) => row.some((cell) => cell.owner !== null)), null, 2));

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => handleEscapeKey(e, undo);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [undo]);

  useEffect(() => {
    const boardEl = boardRef.current;
    const wrapEl = boardWrapRef.current;
    if (!boardEl || !wrapEl) {
      return undefined;
    }

    const tapStart: MutablePoint = { x: null, y: null };
    const lastMid: MutablePoint = { x: null, y: null };
    const didTwoFingerScroll: MutableBool = { value: false };
    const tapMoveThresholdPx = 8;

    const getBoardDownArgs = (clientX: number, clientY: number): BoardDownArgs => ({
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

    const onTouchStart = (e: TouchEvent): void => onBoardTouchStart({ tapStart, lastMid, didTwoFingerScroll }, e);
    const onTouchMove = (e: TouchEvent): void =>
      onBoardTouchMove({ wrapEl, tapStart, lastMid, didTwoFingerScroll, tapMoveThresholdPx }, e);
    const onTouchEnd = (e: TouchEvent): void =>
      onBoardTouchEnd({ tapStart, lastMid, didTwoFingerScroll, getBoardDownArgs }, e);

    boardEl.addEventListener("touchstart", onTouchStart, { passive: true });
    boardEl.addEventListener("touchmove", onTouchMove, { passive: false });
    boardEl.addEventListener("touchend", onTouchEnd, { passive: true });
    boardEl.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      boardEl.removeEventListener("touchstart", onTouchStart);
      boardEl.removeEventListener("touchmove", onTouchMove);
      boardEl.removeEventListener("touchend", onTouchEnd);
      boardEl.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [cellSizePx, cols, placeLmb, placeRmb, polygonClick, rows, state.mode]);

  const currentPlayerName = t(currentPlayer);
  const turnLabel = formatTurnLabel(t, mode, currentPlayerName);
  const winnerText = formatWinnerText(t, winner, surrenderedBy);

  const gridLinesData = useMemo(
    () => buildGridLinesData({ rows, cols, cellSizePx, width, height }),
    [rows, cols, cellSizePx, width, height]
  );

  const polygonData = useMemo(() => buildPolygonData(polygons, cellSizePx), [polygons, cellSizePx]);

  const previewPoints = useMemo(() => buildPreviewPoints(mode, chainPath, cellSizePx), [mode, chainPath, cellSizePx]);

  const dotData = useMemo(() => buildDotData(cells, cellSizePx), [cells, cellSizePx]);

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.scores}>
          <span className={styles.scoreP0}>
            {t("player0")}: {scores.player0}
          </span>
          <span className={styles.scoreP1}>
            {t("player1")}: {scores.player1}
          </span>
        </div>
        <div className={styles.turn}>
          <span className={styles.turnStrong}>{t("statusLabel")}</span> {turnLabel}
        </div>
      </div>
      <p className={styles.hint}>{t("rulesShort")}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.btn} onClick={undo}>
          {t("undo")}
        </button>
        <button type="button" className={styles.btn} onClick={clear}>
          {t("clear")}
        </button>
        <button type="button" className={styles.btn} onClick={surrender} disabled={state.mode === "ended"}>
          {t("surrender")}
        </button>
      </div>
      <div ref={boardWrapRef} className={styles.boardWrap}>
        <div
          ref={boardRef}
          className={styles.board}
          style={{ width, height }}
          onMouseDown={(e) =>
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
          onContextMenu={(e) => e.preventDefault()}
        >
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
              <polyline
                fill="none"
                stroke="var(--dots-preview)"
                strokeWidth={2}
                strokeDasharray="6 4"
                points={previewPoints}
              />
            ) : null}
          </svg>
          <div className={styles.dotsLayer}>
            {dotData.map((d) => (
              <div key={d.key} className={`${styles.dot} ${d.cls}`} style={{ left: d.left, top: d.top }} />
            ))}
          </div>
        </div>
      </div>
      {winnerText ? <div className={styles.overlay}>{winnerText}</div> : null}
    </div>
  );
}
