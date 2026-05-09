"use client";

import type { ReactElement, ReactNode } from "react";

import styles from "./ToolbarButton.module.css";

export type ToolbarButtonProps = Readonly<{
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}>;

/** Shared UI button with consistent app styling. */
export function ToolbarButton({ onClick, disabled = false, className, children }: ToolbarButtonProps): ReactElement {
  const mergedClassName = className ? `${styles.btn} ${className}` : styles.btn;
  return (
    <button type="button" className={mergedClassName} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
