"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import styles from "./DraftIdentityFields.module.css";
import { TextInput } from "@/FSD/shared/ui/input/TextInput";

type DraftIdentityFieldsProps = Readonly<{
  name: string;
  password: string;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}>;

/** Draft-only fields (room name + optional password); password emptiness flips privacy. */
export function DraftIdentityFields(props: DraftIdentityFieldsProps): ReactElement {
  const t = useTranslations("DotsGame");
  return (
    <div className={styles.fields}>
      <label className={styles.fieldLabel}>
        <span>{t("roomNameLabel")}</span>
        <TextInput
          value={props.name}
          onChange={props.onNameChange}
          placeholder={t("roomNamePlaceholder")}
          isClearable
        />
      </label>
      <label className={styles.fieldLabel}>
        <span>{t("passwordOptional")}</span>
        <TextInput
          value={props.password}
          onChange={props.onPasswordChange}
          placeholder={t("passwordPlaceholder")}
          isPassword
          isClearable
        />
      </label>
    </div>
  );
}
