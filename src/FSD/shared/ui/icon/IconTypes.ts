import type { UiSize } from "../../lib/common/types";

export type IconName = "close" | "fetching" | "hamburger" | "hide" | "lock" | "pencil" | "plus" | "show" | "viewers";

export type IconProps = Readonly<{
  color?: string;
  title?: string;
  iconName: IconName;
  size?: UiSize;
}>;
