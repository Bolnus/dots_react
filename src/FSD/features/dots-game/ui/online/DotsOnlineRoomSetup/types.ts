import type { DotsGameConfig } from "../../../model/types";

export type CreateRoomDraft = Readonly<{
  name: string;
  config: DotsGameConfig;
  password: string;
}>;

export type DotsOnlineRoomSetupProps = Readonly<{
  /** When `null`, the form is in "draft" mode: clicking the primary button creates the room. */
  roomId: string | null;
  userId: string;
  /** True while the parent's create-room mutation is in flight (draft mode only). */
  isCreating?: boolean;
  onBack?: () => void;
  onGameStarted: (roomId: string) => void;
  onLeftRoom: () => void;
  onCreateRoom: (draft: CreateRoomDraft) => void;
}>;

export type DraftFormState = Readonly<{
  name: string;
  rows: number | undefined;
  cols: number | undefined;
  password: string;
}>;
