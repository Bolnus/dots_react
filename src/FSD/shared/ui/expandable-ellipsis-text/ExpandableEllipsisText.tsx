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

/** Invokes `onOutside` when the event target is outside `root`. */
function handlePointer(root: HTMLElement, onOutside: () => void, event: MouseEvent | TouchEvent): void {
  if (!(event.target instanceof Node) || !root.contains(event.target)) {
    onOutside();
  }
}

/** Invokes `onEscape` when Escape is pressed. */
function handleKey(onEscape: () => void, event: KeyboardEvent) {
  if (event.key === "Escape") {
    onEscape();
  }
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
    const handlePointerLocal = (event: MouseEvent | TouchEvent): void =>
      handlePointer(root, () => setIsOpen(false), event);
    const handleKeyLocal = (event: KeyboardEvent): void => handleKey(() => setIsOpen(false), event);
    document.addEventListener("mousedown", handlePointerLocal);
    document.addEventListener("touchstart", handlePointerLocal, { capture: true });
    window.addEventListener("keydown", handleKeyLocal);
    return () => {
      document.removeEventListener("mousedown", handlePointerLocal);
      document.removeEventListener("touchstart", handlePointerLocal, { capture: true });
      window.removeEventListener("keydown", handleKeyLocal);
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
