"use client";

import type { ReactElement, ReactNode } from "react";

import styles from "./DotsGameStartButton.module.css";
import { Icon } from "@/FSD/shared/ui/icon/Icon";

export type DotsGameStartButtonProps = Readonly<{
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children: ReactNode;
}>;

/** Bright call-to-action for the dots setup screen with a cycling rim animation. */
export function DotsGameStartButton({
  onClick,
  disabled = false,
  isLoading = false,
  children
}: DotsGameStartButtonProps): ReactElement {
  const isDisabled = disabled || isLoading;
  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.btn} onClick={onClick} disabled={isDisabled} aria-busy={isLoading}>
        {isLoading ? (
          <span className={styles.loadingContent}>
            <Icon iconName="fetching" size="sm" />
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    </div>
  );
}
