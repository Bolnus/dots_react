"use client";

import type { ReactElement, ReactNode } from "react";

import styles from "./DotsGameStartButton.module.css";

export type DotsGameStartButtonProps = Readonly<{
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}>;

/** Bright call-to-action for the dots setup screen with a cycling rim animation. */
export function DotsGameStartButton({ onClick, disabled = false, children }: DotsGameStartButtonProps): ReactElement {
  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.btn} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    </div>
  );
}
