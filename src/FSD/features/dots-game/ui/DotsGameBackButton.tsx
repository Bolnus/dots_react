"use client";

import type { ReactElement } from "react";

import styles from "./DotsGameBackButton.module.css";

export type DotsGameBackButtonProps = Readonly<{
  onClick: () => void;
  label: string;
}>;

/** Generic feature-local back button (callback-based; pairs with internal view state). */
export function DotsGameBackButton({ onClick, label }: DotsGameBackButtonProps): ReactElement {
  return (
    <button type="button" className={styles.backButton} onClick={onClick}>
      <span aria-hidden className={styles.arrow}>
        ←
      </span>
      <span>{label}</span>
    </button>
  );
}
