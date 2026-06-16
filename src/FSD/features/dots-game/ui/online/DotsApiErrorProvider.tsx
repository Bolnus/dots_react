"use client";

import type { ReactElement, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { useDotsApiErrors } from "../../api/useDotsApiErrors";
import { InfoModal } from "@/FSD/shared/ui/info-modal/InfoModal";

export type DotsApiErrorProviderProps = Readonly<{
  children: ReactNode;
}>;

/** Single global host for dots REST API error modals. */
export function DotsApiErrorProvider({ children }: DotsApiErrorProviderProps): ReactElement {
  const t = useTranslations("DotsGame");
  const { errorMessage, clearError } = useDotsApiErrors();

  return (
    <>
      {children}
      <InfoModal
        isOpen={errorMessage !== null}
        title={t("errorTitle")}
        message={errorMessage ?? ""}
        buttonLabel={t("errorOk")}
        onClose={clearError}
      />
    </>
  );
}
