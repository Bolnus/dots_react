"use client";

import type { ButtonHTMLAttributes, ReactElement } from "react";

import { Icon } from "@/FSD/shared/ui/icon/Icon";
import type { IconName, UiSize } from "@/FSD/shared/ui/icon/IconTypes";

import styles from "./ButtonIcon.module.css";

export type ButtonIconProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> & {
    type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
    className?: string;
    iconName: IconName;
    iconColor?: string;
    iconTitle?: string;
    iconSize?: UiSize;
  }
>;

/** Compact square button for icon-only actions; merges optional `className` with base styles. */
export function ButtonIcon({
  className,
  iconName,
  iconColor,
  iconTitle,
  iconSize,
  type = "button",
  ...rest
}: ButtonIconProps): ReactElement {
  const mergedClassName = className ? `${styles.root} ${className}` : styles.root;
  return (
    <button type={type} className={mergedClassName} {...rest}>
      <Icon color={iconColor} iconName={iconName} size={iconSize} title={iconTitle} />
    </button>
  );
}
