"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";

import { useDotsGame } from "../model/useDotsGame";
import type { DotsGameConfig, PlayerId } from "../model/types";

import styles from "./DotsGamePlay.module.css";
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
}>;

/** In-game board, scoring, and actions (stage 2). */
export function DotsGamePlay({ config, playerLabels }: DotsGamePlayProps): ReactElement {
  const t = useTranslations("DotsGame");
  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const { state, placeLmb, placeRmb, polygonClick, accept, undo, clear, surrender, currentPlayer } =
    useDotsGame(config);
  const { cells, scores, mode, chainPath, polygons, winner, surrenderedBy, pendingDot } = state;
  const { cellSizePx, rows, cols } = state.config;
  const width = (cols - 1) * cellSizePx;
  const height = (rows - 1) * cellSizePx;

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
  }, [cellSizePx, cols, placeLmb, placeRmb, polygonClick, rows, state.mode]);

  const currentPlayerName = playerLabels[currentPlayer];
  const turnLabel = formatTurnLabel(t, mode, currentPlayerName);
  const winnerText = formatWinnerText(t, winner, surrenderedBy, playerLabels);

  const gridLinesData = useMemo(
    () => buildGridLinesData({ rows, cols, cellSizePx, width, height }),
    [rows, cols, cellSizePx, width, height]
  );

  const polygonData = useMemo(() => buildPolygonData(polygons, cellSizePx), [polygons, cellSizePx]);

  const previewPoints = useMemo(() => buildPreviewPoints(mode, chainPath, cellSizePx), [mode, chainPath, cellSizePx]);

  const dotData = useMemo(() => buildDotData(cells, cellSizePx), [cells, cellSizePx]);

  const dotClassMap: DotClassMap = { p0: styles.dotP0, p1: styles.dotP1, blockedEmpty: styles.dotBlockedEmpty };
  const pendingDotKey = pendingDot ? `d-${pendingDot.r}-${pendingDot.c}` : null;
  const previewStroke = previewStrokeForChain(mode, state.chainStart, state.cells);

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.scores}>
          <span className={styles.scoreP0}>
            {playerLabels.player0}: {scores.player0}
          </span>
          <span className={styles.scoreP1}>
            {playerLabels.player1}: {scores.player1}
          </span>
        </div>
        <div className={styles.turn}>
          <span className={styles.turnStrong}>{t("statusLabel")}</span> {turnLabel}
        </div>
      </div>
      <div className={styles.actions}>
        <ToolbarButton onClick={accept} disabled={state.mode !== "play" || pendingDot === null}>
          {t("accept")}
        </ToolbarButton>
        <ToolbarButton onClick={undo}>{t("undo")}</ToolbarButton>
        <ToolbarButton onClick={clear}>{t("clear")}</ToolbarButton>
        <ToolbarButton onClick={surrender} disabled={state.mode === "ended"}>
          {t("surrender")}
        </ToolbarButton>
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
                stroke={previewStroke}
                strokeWidth={2}
                strokeDasharray="6 4"
                points={previewPoints}
              />
            ) : null}
          </svg>
          <div className={styles.dotsLayer}>
            {dotData.map((d) => (
              <div
                key={d.key}
                className={`${styles.dot} ${dotClassFor(d.owner, d.blocked, dotClassMap)}${
                  pendingDotKey && d.key === pendingDotKey ? ` ${styles.dotPending}` : ""
                }`}
                style={{ left: d.left, top: d.top }}
              />
            ))}
          </div>
        </div>
      </div>
      {winnerText ? <div className={styles.overlay}>{winnerText}</div> : null}
    </div>
  );
}
