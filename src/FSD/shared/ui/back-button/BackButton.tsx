"use client";

import type { ReactElement } from "react";

import styles from "./BackButton.module.css";

export type BackButtonProps = Readonly<{
  onClick: () => void;
  label: string;
}>;

/** Shared back button: arrow glyph + localized label; callers manage the navigation. */
export function BackButton({ onClick, label }: BackButtonProps): ReactElement {
  return (
    <button type="button" className={styles.backButton} onClick={onClick}>
      <span aria-hidden className={styles.arrow}>
        ←
      </span>
      <span>{label}</span>
    </button>
  );
}
