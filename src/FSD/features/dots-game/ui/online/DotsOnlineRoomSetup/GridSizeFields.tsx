"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { DOTS_GRID_MAX, DOTS_GRID_MIN } from "../../../model/consts";

import styles from "./GridSizeFields.module.css";
import { NumberInput } from "@/FSD/shared/ui/input/NumberInput";
import { NumberInputType } from "@/FSD/shared/ui/input/types";

type GridSizeFieldsProps = Readonly<{
  rows: number | undefined;
  cols: number | undefined;
  disabled: boolean;
  onRowsChange: (value: number | undefined) => void;
  onColsChange: (value: number | undefined) => void;
}>;

/** Grid-size form block (rows + cols); shared between draft and in-room modes. */
export function GridSizeFields(props: GridSizeFieldsProps): ReactElement {
  const t = useTranslations("DotsGame");
  return (
    <div className={styles.fields}>
      <label className={styles.fieldLabel}>
        <span>{t("rowsLabel")}</span>
        <NumberInput
          type={NumberInputType.Unsigned}
          value={props.rows}
          min={DOTS_GRID_MIN}
          max={DOTS_GRID_MAX}
          onChange={props.onRowsChange}
          disabled={props.disabled}
        />
      </label>
      <label className={styles.fieldLabel}>
        <span>{t("colsLabel")}</span>
        <NumberInput
          type={NumberInputType.Unsigned}
          value={props.cols}
          min={DOTS_GRID_MIN}
          max={DOTS_GRID_MAX}
          onChange={props.onColsChange}
          disabled={props.disabled}
        />
      </label>
    </div>
  );
}
