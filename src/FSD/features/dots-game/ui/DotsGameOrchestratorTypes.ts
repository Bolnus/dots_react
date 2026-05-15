/** Discriminant for the top-level dots feature navigation stack. */
export enum DotsViewKind {
  Lobby = "lobby",
  HotSeat = "hotseat",
  OnlineList = "online-list",
  OnlineRoomDraft = "online-room-draft",
  OnlineRoom = "online-room",
  OnlinePlay = "online-play"
}

export type DotsView =
  | { kind: DotsViewKind.Lobby }
  | { kind: DotsViewKind.HotSeat }
  | { kind: DotsViewKind.OnlineList }
  | { kind: DotsViewKind.OnlineRoomDraft }
  | { kind: DotsViewKind.OnlineRoom; roomId: string }
  | { kind: DotsViewKind.OnlinePlay; roomId: string };

export type PendingJoin = Readonly<{
  roomId: string;
  asViewer: boolean;
  needsPassword: boolean;
}>;
