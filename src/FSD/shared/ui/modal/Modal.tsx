"use client";

import type { MouseEvent as ReactMouseEvent, ReactElement, ReactNode, RefObject } from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import styles from "./Modal.module.css";
import { ButtonIcon } from "../button-icon/ButtonIcon";

export type ModalProps = Readonly<{
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  /** Aria label for the close button when `onClose` is set. */
  closeAriaLabel?: string;
  /** When false, Escape and backdrop clicks are ignored (modal stays open). */
  isDismissable?: boolean;
}>;

type ModalDismissArgs = Readonly<{
  isDismissable: boolean;
  onClose: (() => void) | undefined;
}>;

/** Escape handler for the modal; closes only when dismissable. */
function onModalKeyDown(event: KeyboardEvent, args: ModalDismissArgs): void {
  if (event.key !== "Escape") {
    return;
  }
  if (!args.isDismissable) {
    return;
  }
  args.onClose?.();
}

/** Click handler for the backdrop; closes only when the user clicks outside the dialog. */
function onBackdropMouseDown(
  event: ReactMouseEvent<HTMLDivElement>,
  dialogRef: RefObject<HTMLDivElement | null>,
  args: ModalDismissArgs
): void {
  if (!args.isDismissable) {
    return;
  }
  const node = dialogRef.current;
  if (node && event.target instanceof Node && node.contains(event.target)) {
    return;
  }
  args.onClose?.();
}

/** Portal-mounted modal with optional title and close control; Escape and backdrop close when dismissable. */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  closeAriaLabel,
  isDismissable = true
}: ModalProps): ReactElement | null {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent): void => onModalKeyDown(event, { isDismissable, onClose });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, isDismissable, onClose]);

  if (!isOpen) {
    return null;
  }
  if (typeof document === "undefined") {
    return null;
  }

  const dialog = (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => onBackdropMouseDown(event, dialogRef, { isDismissable, onClose })}
    >
      <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-label={title}>
        {title || onClose ? (
          <div className={styles.header}>
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {onClose ? (
              <ButtonIcon onClick={onClose} iconName="close" background="ghost" iconSize="sm" title={closeAriaLabel} />
            ) : null}
          </div>
        ) : null}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
