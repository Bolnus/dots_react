/** Top-level dots widget navigation (lobby / hot-seat / online). */
export enum DotsTopViewKind {
  Lobby = "lobby",
  HotSeat = "hotseat",
  Online = "online"
}

export type DotsTopView =
  | { kind: DotsTopViewKind.Lobby }
  | { kind: DotsTopViewKind.HotSeat }
  | { kind: DotsTopViewKind.Online };

/** Online flow navigation inside `DotsOnlineSetup`. */
export enum DotsOnlineViewKind {
  List = "online-list",
  RoomDraft = "online-room-draft",
  Room = "online-room",
  Play = "online-play"
}

export type DotsOnlineView =
  | { kind: DotsOnlineViewKind.List }
  | { kind: DotsOnlineViewKind.RoomDraft }
  | { kind: DotsOnlineViewKind.Room; roomId: string }
  | { kind: DotsOnlineViewKind.Play; roomId: string };

export type PendingJoin = Readonly<{
  roomId: string;
  asViewer: boolean;
  needsPassword: boolean;
}>;
