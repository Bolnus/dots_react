"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";

import styles from "./ExpandableEllipsisText.module.css";

export type ExpandableEllipsisTextProps = Readonly<{
  /** Full line; optional `prefix` is shown before it (e.g. a bold label). */
  text: string;
  /** Optional leading segment, styled stronger than `text`. */
  prefix?: string;
  className?: string;
  /** Accessible label for the toggle (e.g. “Show full status”). */
  toggleAriaLabel: string;
}>;

/** Subscribes to outside pointer events to run `onOutside`. */
function addOutsideCloseListeners(root: HTMLElement, onOutside: () => void): () => void {
  const handlePointer = (event: MouseEvent | TouchEvent): void => {
    if (!(event.target instanceof Node) || !root.contains(event.target)) {
      onOutside();
    }
  };
  document.addEventListener("mousedown", handlePointer);
  document.addEventListener("touchstart", handlePointer, { capture: true });
  return () => {
    document.removeEventListener("mousedown", handlePointer);
    document.removeEventListener("touchstart", handlePointer, { capture: true });
  };
}

/** Subscribes to Escape to run `onEscape`. */
function addEscapeCloseListener(onEscape: () => void): () => void {
  const handleKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      onEscape();
    }
  };
  window.addEventListener("keydown", handleKey);
  return () => {
    window.removeEventListener("keydown", handleKey);
  };
}

/**
 * Single-line summary with ellipsis; tap opens a panel with the full text.
 * Outside click or Escape closes the panel.
 */
export function ExpandableEllipsisText({
  text,
  prefix,
  className,
  toggleAriaLabel
}: ExpandableEllipsisTextProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }
    const removeOutside = addOutsideCloseListeners(root, () => setIsOpen(false));
    const removeEscape = addEscapeCloseListener(() => setIsOpen(false));
    return () => {
      removeOutside();
      removeEscape();
    };
  }, [isOpen]);

  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div ref={rootRef} className={rootClassName}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={toggleAriaLabel}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={styles.triggerInner}>
          {prefix ? (
            <>
              <span className={styles.strongPrefix}>{prefix}</span>{" "}
            </>
          ) : null}
          {text}
        </span>
      </button>
      {isOpen ? (
        <div className={styles.panel} role="region" aria-live="polite">
          <p className={styles.panelText}>
            {prefix ? (
              <>
                <span className={styles.strongPrefix}>{prefix}</span>{" "}
              </>
            ) : null}
            {text}
          </p>
        </div>
      ) : null}
    </div>
  );
}
