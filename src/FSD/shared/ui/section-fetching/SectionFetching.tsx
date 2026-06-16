"use client";

import type { ReactElement } from "react";

import styles from "./SectionFetching.module.css";
import { Icon } from "@/FSD/shared/ui/icon/Icon";

export type SectionFetchingProps = Readonly<{
  label: string;
  compact?: boolean;
}>;

/** Centered fetching spinner with an accessible status label. */
export function SectionFetching({ label, compact = false }: SectionFetchingProps): ReactElement {
  const overlayClassName = compact ? `${styles.loadingOverlay} ${styles.compact}` : styles.loadingOverlay;

  return (
    <div className={overlayClassName} role="status" aria-live="polite">
      <Icon iconName="fetching" size={compact ? "sm" : "lg"} title={label} />
      <span>{label}</span>
    </div>
  );
}
