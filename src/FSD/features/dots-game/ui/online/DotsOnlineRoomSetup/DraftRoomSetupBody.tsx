"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import type { DotsGameConfig } from "../../../model/types";

import { DotsGamePlay } from "../../play/DotsGamePlay";
import { DotsGameStartButton } from "../../play/DotsGameStartButton";
import { buildEffectiveConfig } from "./roomSetupUtils";
import { DraftIdentityFields } from "./DraftIdentityFields";
import styles from "./DraftRoomSetupBody.module.css";
import { GridSizeFields } from "./GridSizeFields";
import type { DraftFormState } from "./types";
import { BackButton } from "@/FSD/shared/ui/back-button/BackButton";

type DraftRoomSetupBodyProps = Readonly<{
  draft: DraftFormState;
  setDraft: (next: DraftFormState) => void;
  defaults: DotsGameConfig;
  isCreating: boolean;
  onBack: () => void;
  onCreate: () => void;
}>;

/** Draft-mode renderer: local-only state, never touches the server until "Create room" is clicked. */
export function DraftRoomSetupBody({
  draft,
  setDraft,
  defaults,
  isCreating,
  onBack,
  onCreate
}: DraftRoomSetupBodyProps): ReactElement {
  const t = useTranslations("DotsGame");
  const effectiveConfig = useMemo(
    () => buildEffectiveConfig({ rows: draft.rows, cols: draft.cols, defaults }),
    [draft.rows, draft.cols, defaults]
  );
  return (
    <div className={styles.setup}>
      <div className={styles.topBar}>
        <BackButton onClick={onBack} label={t("back")} />
        <h2 className={styles.title}>{t("createRoomTitle")}</h2>
        <span aria-hidden style={{ width: 1 }} />
      </div>
      <DraftIdentityFields
        name={draft.name}
        password={draft.password}
        onNameChange={(value) => setDraft({ ...draft, name: value })}
        onPasswordChange={(value) => setDraft({ ...draft, password: value })}
      />
      <GridSizeFields
        rows={draft.rows}
        cols={draft.cols}
        disabled={isCreating}
        onRowsChange={(value) => setDraft({ ...draft, rows: value })}
        onColsChange={(value) => setDraft({ ...draft, cols: value })}
      />
      <div className={styles.actions}>
        <DotsGameStartButton onClick={onCreate} isLoading={isCreating}>
          {t("createRoomAction")}
        </DotsGameStartButton>
      </div>
      <div className={styles.preview}>
        <DotsGamePlay
          key={`preview-${effectiveConfig.rows}x${effectiveConfig.cols}`}
          config={effectiveConfig}
          playerLabels={{ player0: t("player0"), player1: t("player1") }}
          preview
        />
      </div>
    </div>
  );
}
