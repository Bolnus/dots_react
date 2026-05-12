"use client";

import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { useTranslations } from "next-intl";

import styles from "./DotsOnlineNamePromptModal.module.css";
import { Modal } from "@/FSD/shared/ui/modal/Modal";
import { TextInput } from "@/FSD/shared/ui/input/TextInput";

export type DotsOnlineNamePromptModalProps = Readonly<{
  isOpen: boolean;
  initialName: string;
  isRequired: boolean;
  onSubmit: (name: string) => void;
  onClose?: () => void;
}>;

/** Submits the trimmed name when present; no-op when empty (button stays disabled). */
function handleSubmit(event: FormEvent<HTMLFormElement>, value: string, onSubmit: (name: string) => void): void {
  event.preventDefault();
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }
  onSubmit(trimmed);
}

/** Modal that collects (or updates) the online display name; reuses the shared Modal + TextInput. */
export function DotsOnlineNamePromptModal({
  isOpen,
  initialName,
  isRequired,
  onSubmit,
  onClose
}: DotsOnlineNamePromptModalProps): ReactElement {
  const t = useTranslations("DotsGame");
  const [value, setValue] = useState(initialName);

  useEffect(() => {
    if (isOpen) {
      setValue(initialName);
    }
  }, [isOpen, initialName]);

  const trimmed = value.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={isRequired ? undefined : onClose}
      title={t("enterYourName")}
      isDismissable={!isRequired}
    >
      <form className={styles.body} onSubmit={(event) => handleSubmit(event, value, onSubmit)}>
        <label className={styles.fieldLabel}>
          <span>{t("namePlaceholder")}</span>
          <TextInput value={value} onChange={setValue} placeholder={t("namePlaceholder")} isClearable />
        </label>
        <div className={styles.actions}>
          <button type="submit" className={styles.submitButton} disabled={trimmed.length === 0}>
            {t("submitName")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
