import { UiSize } from "../../lib/common/types";

export type IconName = "fetching" | "hamburger";

export type IconProps = Readonly<{
  color?: string;
  title?: string;
  iconName: IconName;
  size?: UiSize;
}>;
