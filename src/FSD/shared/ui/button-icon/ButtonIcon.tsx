"use client";

import type { ButtonHTMLAttributes, MouseEvent as ReactMouseEvent, ReactElement } from "react";

import { Icon } from "@/FSD/shared/ui/icon/Icon";
import type { IconName, UiSize } from "@/FSD/shared/ui/icon/IconTypes";

import styles from "./ButtonIcon.module.css";

/** Visual fill and border treatment for the icon button surface. */
export type ButtonIconBackground = "default" | "ghost" | "solid";

const backgroundClassName: Readonly<Record<ButtonIconBackground, string>> = {
  default: styles.backgroundDefault,
  ghost: styles.backgroundGhost,
  solid: styles.backgroundSolid
};

/** Applies optional `preventDefault` / `stopPropagation`, then invokes `userOnClick` with no arguments when present. */
function applyButtonIconClickOptions(
  event: ReactMouseEvent<HTMLButtonElement>,
  userOnClick: (() => void) | undefined,
  options: Readonly<{ preventDefault: boolean; stopPropagation: boolean }>
): void {
  if (options.preventDefault === true) {
    event.preventDefault();
  }
  if (options.stopPropagation === true) {
    event.stopPropagation();
  }
  userOnClick?.();
}

export type ButtonIconProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children" | "onClick"> & {
    type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
    className?: string;
    iconName: Exclude<IconName, "fetching">;
    iconColor?: string;
    iconTitle?: string;
    iconSize?: UiSize;
    background?: ButtonIconBackground;
    disabled?: boolean;
    title?: string;
    isFetching?: boolean;
    stopPropagation?: boolean;
    preventDefault?: boolean;
    onClick?: () => void;
  }
>;

/** Compact square button for icon-only actions; merges optional `className` with base styles. */
export function ButtonIcon({
  background = "default",
  className,
  disabled = false,
  iconName,
  iconColor,
  iconTitle,
  iconSize,
  isFetching = false,
  onClick,
  preventDefault = false,
  stopPropagation = false,
  title,
  type = "button",
  ...rest
}: ButtonIconProps): ReactElement {
  const isDisabled = disabled === true || isFetching === true;
  const mergedClassName = [styles.root, backgroundClassName[background], className].filter(Boolean).join(" ");
  const resolvedIconName: IconName = isFetching === true ? "fetching" : iconName;

  return (
    <button
      type={type}
      className={mergedClassName}
      title={title}
      disabled={isDisabled}
      aria-busy={isFetching === true ? true : undefined}
      onClick={(event) => applyButtonIconClickOptions(event, onClick, { preventDefault, stopPropagation })}
      {...rest}
    >
      <span className={styles.iconSlot}>
        <Icon color={iconColor} iconName={resolvedIconName} size={iconSize} title={iconTitle} />
      </span>
    </button>
  );
}
