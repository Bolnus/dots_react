import { UiSize } from "../../lib/common/types";

export type IconName = "close" | "fetching" | "hamburger" | "hide" | "show";

export type IconProps = Readonly<{
  color?: string;
  title?: string;
  iconName: IconName;
  size?: UiSize;
}>;
