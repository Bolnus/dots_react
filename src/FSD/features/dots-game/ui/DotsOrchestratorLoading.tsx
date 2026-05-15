"use client";

import type { ReactElement } from "react";

import styles from "./DotsOrchestratorLoading.module.css";
import { Icon } from "@/FSD/shared/ui/icon/Icon";

export type DotsOrchestratorLoadingProps = Readonly<{
  label: string;
}>;

/** Centered fetching spinner shown while a room snapshot is loading. */
export function DotsOrchestratorLoading({ label }: DotsOrchestratorLoadingProps): ReactElement {
  return (
    <div className={styles.loadingOverlay} role="status" aria-live="polite">
      <Icon iconName="fetching" size="lg" title={label} />
      <span>{label}</span>
    </div>
  );
}
