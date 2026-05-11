"use client";

import { useState, type ChangeEvent, type HTMLAttributes, type ReactElement } from "react";

import styles from "./NumberInput.module.css";
import { NumberInputType } from "./types";
import { resetScrollOnBlur } from "../../lib/common/hadlers";

export type NumberInputProps = Readonly<{
  value?: number;
  onChange?: (num: number | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  type?: NumberInputType;
  requiredValue?: number;
  /** When set, the committed value after blur is clamped to this minimum. */
  min?: number;
  /** When set, the committed value after blur is clamped to this maximum. */
  max?: number;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}>;

/** Parses a complete numeric string for the given input kind. */
function toNumberByType(text: string, inputType: NumberInputType): number | undefined {
  let regExp: RegExp;
  switch (inputType) {
    case NumberInputType.Unsigned:
      regExp = /^\d+$/;
      break;
    case NumberInputType.Interger:
      regExp = /^-?\d+$/;
      break;
    case NumberInputType.Float:
      regExp = /^-?\d+(\.\d+)?$/;
      break;
    default:
      regExp = /.?/;
      break;
  }
  const numberValue = Number(text);
  if (regExp.test(text) && numberValue > Number.MIN_SAFE_INTEGER && numberValue < Number.MAX_SAFE_INTEGER) {
    return numberValue;
  }
  return undefined;
}

/** Parses a non-negative integer string. */
function toUnsigned(text: string): number | undefined {
  return toNumberByType(text, NumberInputType.Unsigned);
}

/** Parses a signed integer string. */
function toInteger(text: string): number | undefined {
  return toNumberByType(text, NumberInputType.Interger);
}

/** Parses a signed decimal string. */
function toFloat(text: string): number | undefined {
  return toNumberByType(text, NumberInputType.Float);
}

/** Applies optional inclusive min/max bounds. */
function clampToOptionalBounds(value: number, min?: number, max?: number): number {
  let result = value;
  if (min !== undefined) {
    result = Math.max(min, result);
  }
  if (max !== undefined) {
    result = Math.min(max, result);
  }
  return result;
}

/** Returns a parsed number or `undefined` if the string is not a complete value. */
function parseByInputType(text: string, inputType: NumberInputType): number | undefined {
  switch (inputType) {
    case NumberInputType.Unsigned:
      return toUnsigned(text);
    case NumberInputType.Interger:
      return toInteger(text);
    case NumberInputType.Float:
      return toFloat(text);
    default:
      return undefined;
  }
}

/** Notifies parent: empty → `undefined`, otherwise best-effort parse while typing. */
function syncParentValueFromText(
  text: string,
  inputType: NumberInputType,
  onParentChange?: (num: number | undefined) => void
): void {
  if (!onParentChange) {
    return;
  }
  if (text === "") {
    onParentChange(undefined);
    return;
  }
  onParentChange(parseByInputType(text, inputType));
}

/** Updates local text, validates by `inputType`, and syncs the parent `onChange`. */
function onNumberInputChange(
  event: ChangeEvent<HTMLInputElement>,
  inputType: NumberInputType,
  setLocalText: (text: string) => void,
  onParentChange?: (num: number | undefined) => void
): void {
  event.preventDefault();
  const inputElement = event.target;
  const next = inputElement.value;

  if (next === "" || next === undefined) {
    setLocalText("");
    syncParentValueFromText("", inputType, onParentChange);
    return;
  }
  if (typeof next !== "string") {
    return;
  }
  switch (inputType) {
    case NumberInputType.Unsigned:
      if (/^\d*$/.test(next)) {
        setLocalText(next);
        syncParentValueFromText(next, inputType, onParentChange);
      }
      break;
    case NumberInputType.Interger:
      if (/^-?\d*$/.test(next)) {
        setLocalText(next);
        syncParentValueFromText(next, inputType, onParentChange);
      }
      break;
    case NumberInputType.Float:
      if (/^-?\d*(\.\d*)?$/.test(next)) {
        setLocalText(next);
        syncParentValueFromText(next, inputType, onParentChange);
      }
      break;
    default:
      break;
  }
}

/** Finalizes value on blur: required fallback, parse repair, and min/max clamp. */
function onNumberInputBlur(
  args: Readonly<{
    localText: string;
    inputType: NumberInputType;
    setLocalText: (text: string) => void;
    onChange?: (num: number | undefined) => void;
    requiredValue?: number;
    min?: number;
    max?: number;
  }>
): void {
  const { localText, inputType, setLocalText, onChange, requiredValue, min, max } = args;
  resetScrollOnBlur();
  if (!onChange) {
    return;
  }

  if (localText === "") {
    if (requiredValue !== undefined) {
      const fallback = clampToOptionalBounds(requiredValue, min, max);
      onChange(fallback);
      setLocalText(String(fallback));
    } else {
      onChange(undefined);
    }
    return;
  }

  const parsed = parseByInputType(localText, inputType);
  if (parsed === undefined && requiredValue !== undefined) {
    const fallback = clampToOptionalBounds(requiredValue, min, max);
    onChange(fallback);
    setLocalText(String(fallback));
    return;
  }
  if (parsed !== undefined) {
    const clamped = clampToOptionalBounds(parsed, min, max);
    if (clamped !== parsed) {
      setLocalText(String(clamped));
    }
    onChange(clamped);
    return;
  }
  onChange(undefined);
}

/** Controlled numeric text field with optional min/max clamping on blur. */
export function NumberInput({
  value,
  onChange,
  className,
  disabled,
  placeholder,
  requiredValue,
  type = NumberInputType.Interger,
  min,
  max,
  inputMode = "numeric"
}: NumberInputProps): ReactElement {
  const [localValue, setLocalValue] = useState(() => (value === undefined || value === null ? "" : String(value)));

  const rootClassName = className ? `${className} ${styles.textInput}` : styles.textInput;

  return (
    <div className={rootClassName}>
      <input
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        onBlur={() =>
          onNumberInputBlur({
            localText: localValue,
            inputType: type,
            setLocalText: setLocalValue,
            onChange,
            requiredValue,
            min,
            max
          })
        }
        value={localValue}
        onChange={(event) => onNumberInputChange(event, type, setLocalValue, onChange)}
        className={styles.textInput__input}
        disabled={disabled}
        onFocus={(event) => event.currentTarget.select()}
      />
    </div>
  );
}
