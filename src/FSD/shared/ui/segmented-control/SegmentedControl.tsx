import type { ReactElement, ReactNode } from "react";

import styles from "./SegmentedControl.module.css";

export type SegmentedControlProps = Readonly<{
  ariaLabel: string;
  children: ReactNode;
}>;

/** Pill-style segmented group (`role="group"`) for locale, theme, or similar toggles. */
export function SegmentedControl({ ariaLabel, children }: SegmentedControlProps): ReactElement {
  return (
    <div className={styles.root} role="group" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

/** Maps active state to CSS module classes for links or buttons inside `SegmentedControl`. */
export function segmentedItemClassName(active: boolean): string {
  return active ? styles.itemActive : styles.item;
}
