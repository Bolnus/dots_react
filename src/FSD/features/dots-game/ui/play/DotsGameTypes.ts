"use client";

import type { GridPoint } from "../../model/types";

export type BoardPointerHandlers = Readonly<{
  mode: "play" | "drawPolygon" | "ended";
  cellSizePx: number;
  rows: number;
  cols: number;
  placeLmb: (p: GridPoint) => void;
  polygonClick: (p: GridPoint) => void;
}>;

export type BoardDownArgs = Readonly<{
  clientX: number;
  clientY: number;
  boardEl: HTMLElement;
  mode: "play" | "drawPolygon" | "ended";
  cellSizePx: number;
  rows: number;
  cols: number;
  placeLmb: (p: GridPoint) => void;
  polygonClick: (p: GridPoint) => void;
}>;

export type MutablePoint = { x: number | null; y: number | null };

export type DotClassMap = Readonly<{
  p0: string;
  p1: string;
  blockedEmpty: string;
}>;
