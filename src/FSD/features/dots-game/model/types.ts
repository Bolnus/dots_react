export type PlayerId = 0 | 1;

/** One intersection on the board (matches Qt grid dots). */
export type GridPoint = Readonly<{
  r: number;
  c: number;
}>;

/** One playable intersection: empty, owned by a player, and/or blocked after capture. */
export type CellState = Readonly<{
  owner: PlayerId | null;
  /** Captured interior or blocked empty cell inside a polygon. */
  blocked: boolean;
}>;

export type FilledPolygon = Readonly<{
  owner: PlayerId;
  /** Closed ring without duplicated closing vertex. */
  ring: GridPoint[];
}>;

export type DotsGameConfig = Readonly<{
  rows: number;
  cols: number;
  cellSizePx: number;
}>;

export type DotsGameMode = "play" | "drawPolygon" | "ended";

export type DotsGameState = Readonly<{
  config: DotsGameConfig;
  cells: CellState[][];
  /** Number of successful dot placements (Qt `DotItem::dotsCounter`). */
  dotsPlacedCount: number;
  scores: readonly [number, number];
  mode: DotsGameMode;
  winner: PlayerId | null;
  /** Winner by surrender (opponent gets the win). */
  surrenderedBy: PlayerId | null;
  /** When drawing an enclosure, fixed start of the chain. */
  chainStart: GridPoint | null;
  /** Visited vertices in order; closing click duplicates `chainStart` at the end. */
  chainPath: GridPoint[];
  polygons: FilledPolygon[];
  /** Stack of placed dot positions for undo (LMB / RMB starter). */
  placementStack: GridPoint[];
}>;
