export type PlayerId = "player0" | "player1";

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

/** One undo step: dot placement or completed polygon capture. */
export type UndoEntry =
  | Readonly<{ type: "placement"; point: GridPoint }>
  | Readonly<{
      type: "capture";
      capturer: PlayerId;
      blockedCells: GridPoint[];
      /** RMB dot that began this enclosure; removed together with the capture on undo. */
      enclosureStarter: GridPoint;
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
  /**
   * Dot placed during the current turn but not committed yet.
   * The turn is only finalized when the player presses Accept or completes a polygon.
   */
  pendingDot: GridPoint | null;
  scores: Readonly<Record<PlayerId, number>>;
  mode: DotsGameMode;
  winner: PlayerId | null;
  /** Winner by surrender (opponent gets the win). */
  surrenderedBy: PlayerId | null;
  /** When drawing an enclosure, fixed start of the chain. */
  chainStart: GridPoint | null;
  /** Visited vertices in order; closing click duplicates `chainStart` at the end. */
  chainPath: GridPoint[];
  polygons: FilledPolygon[];
  /** LIFO undo: placements (LMB/RMB) and completed captures. */
  undoStack: UndoEntry[];
}>;

/** Discriminated union dispatched by `useDotsGame` into `reduceDotsGame`. */
export type DotsGameAction =
  | { type: "CLEAR" }
  | { type: "UNDO" }
  | { type: "SURRENDER" }
  | { type: "ACCEPT" }
  | { type: "PLACE_LMB"; point: GridPoint }
  | { type: "PLACE_RMB"; point: GridPoint }
  | { type: "POLYGON_CLICK"; point: GridPoint };
