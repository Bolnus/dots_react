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

/** Closed padlock used to mark password-protected resources. */
function LockIcon({ color, title, size }: SvgIconProps): ReactElement {
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
      <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
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

/** Spectator eye glyph (outlined pupil) — distinct from password `show`. */
function ViewersIcon({ color, title, size }: SvgIconProps): ReactElement {
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
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="2" />
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

/** Edit / rename pencil glyph (stroke inherits `currentColor`). */
function PencilIcon({ color, title, size }: SvgIconProps): ReactElement {
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
        d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

/** AI opponent badge (stroke inherits `currentColor`). */
function AiIcon({ color, title, size }: SvgIconProps): ReactElement {
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
      <rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M9 10h.01M12 10h.01M15 10h.01M9 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

/** Plus glyph used for primary "add" actions (rooms, items). */
function PlusIcon({ color, title, size }: SvgIconProps): ReactElement {
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
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
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
  if (props.iconName === "ai") {
    return <AiIcon color={props.color} title={props.title} size={props.size} />;
  }
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
  if (props.iconName === "lock") {
    return <LockIcon color={props.color} title={props.title} size={props.size} />;
  }
  if (props.iconName === "pencil") {
    return <PencilIcon color={props.color} title={props.title} size={props.size} />;
  }
  if (props.iconName === "plus") {
    return <PlusIcon color={props.color} title={props.title} size={props.size} />;
  }
  if (props.iconName === "show") {
    return <ShowIcon color={props.color} title={props.title} size={props.size} />;
  }
  if (props.iconName === "viewers") {
    return <ViewersIcon color={props.color} title={props.title} size={props.size} />;
  }
  const unreachable: never = props.iconName;
  return unreachable;
}
