import type { UiSize } from "../../lib/common/types";

export type IconName =
  | "ai"
  | "close"
  | "fetching"
  | "hamburger"
  | "hide"
  | "lock"
  | "pencil"
  | "plus"
  | "show"
  | "viewers";

export type IconProps = Readonly<{
  color?: string;
  title?: string;
  iconName: IconName;
  size?: UiSize;
}>;
