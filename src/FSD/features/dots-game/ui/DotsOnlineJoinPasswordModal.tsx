"use client";

import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { useTranslations } from "next-intl";

import styles from "./DotsOnlineNamePromptModal.module.css";
import { Modal } from "@/FSD/shared/ui/modal/Modal";
import { TextInput } from "@/FSD/shared/ui/input/TextInput";

export type DotsOnlineJoinPasswordModalProps = Readonly<{
  isOpen: boolean;
  errorText: string | null;
  isSubmitting: boolean;
  onSubmit: (password: string) => void;
  onClose: () => void;
}>;

/** Submits the entered password (allows empty string to test the password). */
function onPasswordSubmit(
  event: FormEvent<HTMLFormElement>,
  value: string,
  onSubmit: (password: string) => void
): void {
  event.preventDefault();
  onSubmit(value);
}

/** Modal that prompts the user for a room password when joining a private room. */
export function DotsOnlineJoinPasswordModal({
  isOpen,
  errorText,
  isSubmitting,
  onSubmit,
  onClose
}: DotsOnlineJoinPasswordModalProps): ReactElement {
  const t = useTranslations("DotsGame");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue("");
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("passwordPromptLabel")}>
      <form className={styles.body} onSubmit={(event) => onPasswordSubmit(event, value, onSubmit)}>
        <label className={styles.fieldLabel}>
          <span>{t("password")}</span>
          <TextInput value={value} onChange={setValue} isPassword isClearable disabled={isSubmitting} />
        </label>
        {errorText ? <span>{errorText}</span> : null}
        <div className={styles.actions}>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {t("submitName")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
