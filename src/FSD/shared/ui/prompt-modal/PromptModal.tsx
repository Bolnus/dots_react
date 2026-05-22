"use client";

import { useEffect, useState, type ReactElement, type SubmitEventHandler } from "react";

import { Modal } from "@/FSD/shared/ui/modal/Modal";
import { TextInput } from "@/FSD/shared/ui/input/TextInput";
import { Icon } from "@/FSD/shared/ui/icon/Icon";

import styles from "./PromptModal.module.css";

export type PromptModalProps = Readonly<{
  isOpen: boolean;
  title: string;
  fieldLabel: string;
  submitLabel: string;
  placeholder?: string;
  /** Resets the field when the modal opens; defaults to empty string. */
  initialValue?: string;
  isPassword?: boolean;
  isClearable?: boolean;
  isDismissable?: boolean;
  isSubmitting?: boolean;
  errorText?: string | null;
  /** When true, trims on submit and disables submit while the trimmed value is empty. */
  requireNonEmpty?: boolean;
  onSubmit: (value: string) => void;
  onClose?: () => void;
}>;

/** Modal with a single text field and submit action (name, password, etc.). */
export function PromptModal({
  isOpen,
  title,
  fieldLabel,
  submitLabel,
  placeholder,
  initialValue = "",
  isPassword = false,
  isClearable = false,
  isDismissable = true,
  isSubmitting = false,
  errorText = null,
  requireNonEmpty = false,
  onSubmit,
  onClose
}: PromptModalProps): ReactElement {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const trimmed = value.trim();
  const isSubmitDisabled = isSubmitting || (requireNonEmpty && trimmed.length === 0);

  const onFormSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const submitted = requireNonEmpty ? trimmed : value;
    if (requireNonEmpty && submitted.length === 0) {
      return;
    }
    onSubmit(submitted);
  };

  return (
    <Modal isOpen={isOpen} onClose={isDismissable ? onClose : undefined} title={title} isDismissable={isDismissable}>
      <form className={styles.body} onSubmit={onFormSubmit}>
        <label className={styles.fieldLabel}>
          <span>{fieldLabel}</span>
          <TextInput
            value={value}
            onChange={setValue}
            placeholder={placeholder}
            isPassword={isPassword}
            isClearable={isClearable}
            disabled={isSubmitting}
          />
        </label>
        {errorText ? <p className={styles.error}>{errorText}</p> : null}
        <div className={styles.actions}>
          <button type="submit" className={styles.submitButton} disabled={isSubmitDisabled} aria-busy={isSubmitting}>
            {isSubmitting ? <Icon iconName="fetching" title={submitLabel} /> : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
