"use client";

import type { ReactElement } from "react";

import { Modal } from "@/FSD/shared/ui/modal/Modal";

import styles from "./InfoModal.module.css";

export type InfoModalProps = Readonly<{
  isOpen: boolean;
  title: string;
  message: string;
  buttonLabel: string;
  onClose: () => void;
}>;

/** Single-action modal for server or client error messages. */
export function InfoModal({ isOpen, title, message, buttonLabel, onClose }: InfoModalProps): ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} isDismissable>
      <div className={styles.body}>
        <p className={styles.message}>{message}</p>
        <button type="button" className={styles.button} onClick={onClose}>
          {buttonLabel}
        </button>
      </div>
    </Modal>
  );
}
