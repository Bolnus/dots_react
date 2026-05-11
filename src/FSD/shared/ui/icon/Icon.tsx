import type { CSSProperties, ReactElement } from "react";

import type { IconProps, UiSize } from "./IconTypes";
import styles from "./Icon.module.css";

/** Resolves the fetching ring size class; defaults to medium. */
function getFetchingSizeClassName(size: UiSize | undefined): string {
  const resolved = size ?? "md";
  if (resolved === "sm") {
    return styles.fetchingSm;
  }
  if (resolved === "md") {
    return styles.fetchingMd;
  }
  if (resolved === "lg") {
    return styles.fetchingLg;
  }
  const unreachable: never = resolved;
  return unreachable;
}

/** Resolves the hamburger glyph size class; defaults to medium. */
function getHamburgerSizeClassName(size: UiSize | undefined): string {
  const resolved = size ?? "md";
  if (resolved === "sm") {
    return styles.hamburgerSm;
  }
  if (resolved === "md") {
    return styles.hamburgerMd;
  }
  if (resolved === "lg") {
    return styles.hamburgerLg;
  }
  const unreachable: never = resolved;
  return unreachable;
}

/** Three-line menu indicator built with CSS gradients (inherits `currentColor`). */
function HamburgerIcon({ color, title, size }: Readonly<Pick<IconProps, "color" | "title" | "size">>): ReactElement {
  const sizeClassName = getHamburgerSizeClassName(size);
  const className = `${styles.hamburger} ${sizeClassName}`;
  const style: CSSProperties | undefined = color ? { color } : undefined;

  if (title === undefined) {
    return <span className={className} style={style} aria-hidden />;
  }

  return <span className={className} style={style} role="img" aria-label={title} title={title} />;
}

/** Indeterminate progress ring (inherits `currentColor`). */
function FetchingIcon({ color, title, size }: Readonly<Pick<IconProps, "color" | "title" | "size">>): ReactElement {
  const sizeClassName = getFetchingSizeClassName(size);
  const className = `${styles.fetching} ${sizeClassName}`;
  const style: CSSProperties | undefined = color ? { color } : undefined;

  if (title === undefined) {
    return <span className={className} style={style} aria-hidden />;
  }

  return <span className={className} style={style} role="img" aria-label={title} title={title} />;
}

/** Single entry point for glyphs used in buttons and inline UI. */
export function Icon(props: IconProps): ReactElement {
  if (props.iconName === "fetching") {
    return <FetchingIcon color={props.color} title={props.title} size={props.size} />;
  }
  if (props.iconName === "hamburger") {
    return <HamburgerIcon color={props.color} title={props.title} size={props.size} />;
  }
  const unreachable: never = props.iconName;
  return unreachable;
}
