"use client";

import type { ReactElement } from "react";

import styles from "./OptionButton.module.css";

export type OptionButtonProps = Readonly<{
  label: string;
  hint?: string;
  disabled?: boolean;
  onClick: () => void;
}>;

/** Card-style picker button: bold label + optional hint; tuned for choice grids (lobbies, menus). */
export function OptionButton({ label, hint, disabled = false, onClick }: OptionButtonProps): ReactElement {
  return (
    <button type="button" className={styles.optionButton} onClick={onClick} disabled={disabled}>
      <span className={styles.optionLabel}>{label}</span>
      {hint ? <span className={styles.optionHint}>{hint}</span> : null}
    </button>
  );
}
