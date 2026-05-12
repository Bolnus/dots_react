import type { CSSProperties, ReactElement } from "react";

import type { IconProps } from "./IconTypes";
import styles from "./Icon.module.css";
import type { UiSize } from "../../lib/common/types";

type SvgIconProps = Readonly<Pick<IconProps, "color" | "title" | "size">>;

/** Matches `hamburger*` / `fetching*` footprint for layout alignment. */
function getSvgBoxPixels(size: UiSize | undefined): number {
  const resolved = size ?? "md";
  if (resolved === "sm") {
    return 14;
  }
  if (resolved === "md") {
    return 18;
  }
  if (resolved === "lg") {
    return 22;
  }
  const unreachable: never = resolved;
  return unreachable;
}

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

/** Dismiss / clear control (stroke inherits `currentColor`). */
function CloseIcon({ color, title, size }: SvgIconProps): ReactElement {
  const px = getSvgBoxPixels(size);
  const style: CSSProperties | undefined = color ? { color } : undefined;
  const svg = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.svgGlyph}
      style={style}
      aria-hidden={title === undefined ? true : undefined}
    >
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );

  if (title === undefined) {
    return svg;
  }

  return (
    <span className={styles.svgGlyphWrap} role="img" aria-label={title} title={title}>
      {svg}
    </span>
  );
}

/** Password visibility on (stroke inherits `currentColor`). */
function ShowIcon({ color, title, size }: SvgIconProps): ReactElement {
  const px = getSvgBoxPixels(size);
  const style: CSSProperties | undefined = color ? { color } : undefined;
  const svg = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.svgGlyph}
      style={style}
      aria-hidden={title === undefined ? true : undefined}
    >
      <path
        d="M1 12s4.5-7 11-7 11 7 11 7-4.5 7-11 7-11-7-11-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );

  if (title === undefined) {
    return svg;
  }

  return (
    <span className={styles.svgGlyphWrap} role="img" aria-label={title} title={title}>
      {svg}
    </span>
  );
}

/** Password visibility off (stroke inherits `currentColor`). */
function HideIcon({ color, title, size }: SvgIconProps): ReactElement {
  const px = getSvgBoxPixels(size);
  const style: CSSProperties | undefined = color ? { color } : undefined;
  const svg = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.svgGlyph}
      style={style}
      aria-hidden={title === undefined ? true : undefined}
    >
      <path
        d="M1 12s4.5-7 11-7 11 7 11 7-4.5 7-11 7-11-7-11-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M4 4L20 20" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );

  if (title === undefined) {
    return svg;
  }

  return (
    <span className={styles.svgGlyphWrap} role="img" aria-label={title} title={title}>
      {svg}
    </span>
  );
}

/** Three-line menu indicator built with CSS gradients (inherits `currentColor`). */
function HamburgerIcon({ color, title, size }: SvgIconProps): ReactElement {
  const sizeClassName = getHamburgerSizeClassName(size);
  const className = `${styles.hamburger} ${sizeClassName}`;
  const style: CSSProperties | undefined = color ? { color } : undefined;

  if (title === undefined) {
    return <span className={className} style={style} aria-hidden />;
  }

  return <span className={className} style={style} role="img" aria-label={title} title={title} />;
}

/** Indeterminate progress ring (inherits `currentColor`). */
function FetchingIcon({ color, title, size }: SvgIconProps): ReactElement {
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
  if (props.iconName === "close") {
    return <CloseIcon color={props.color} title={props.title} size={props.size} />;
  }
  if (props.iconName === "fetching") {
    return <FetchingIcon color={props.color} title={props.title} size={props.size} />;
  }
  if (props.iconName === "hamburger") {
    return <HamburgerIcon color={props.color} title={props.title} size={props.size} />;
  }
  if (props.iconName === "hide") {
    return <HideIcon color={props.color} title={props.title} size={props.size} />;
  }
  if (props.iconName === "show") {
    return <ShowIcon color={props.color} title={props.title} size={props.size} />;
  }
  const unreachable: never = props.iconName;
  return unreachable;
}
