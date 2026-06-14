import type { UiSize } from "../../lib/common/types";

export type IconName =
  | "ai"
  | "board"
  | "chat"
  | "chatUnread"
  | "close"
  | "fetching"
  | "hamburger"
  | "hide"
  | "lock"
  | "pencil"
  | "plus"
  | "send"
  | "show"
  | "viewers";

export type IconProps = Readonly<{
  color?: string;
  title?: string;
  iconName: IconName;
  size?: UiSize;
}>;
