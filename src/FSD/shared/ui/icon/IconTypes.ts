export type UiSize = "sm" | "md" | "lg";

export type IconName = "hamburger";

export type IconProps = Readonly<{
  color?: string;
  title?: string;
  iconName: IconName;
  size?: UiSize;
}>;
