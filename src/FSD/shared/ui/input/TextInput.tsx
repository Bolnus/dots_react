"use client";
import React from "react";
import classes from "./TextInput.module.css";
import { resetScrollOnBlur } from "../../lib/common/hadlers";
import { ButtonIcon } from "../button-icon/ButtonIcon";

interface TextInputProps {
  value: string;
  onChange?: (str: string) => void;
  isClearable?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  isPassword?: boolean;
  autoComplete?: string;
  name?: string;
  isFetching?: boolean;
}

/** Forwards the native input value to `onChange`. */
function onInputChange(localEvent: React.ChangeEvent<HTMLInputElement>, onChange?: (str: string) => void): void {
  localEvent.preventDefault();
  if (!onChange) {
    return;
  }
  onChange(localEvent.target.value);
}

/** Clears the field via `onChange("")`. */
function onClearInput(onChange?: (str: string) => void): void {
  onChange?.("");
}

/** Controlled text field with optional clear and password-visibility controls. */
export function TextInput({
  value,
  onChange,
  isClearable,
  className,
  disabled,
  placeholder,
  isPassword,
  name,
  autoComplete = "off",
  isFetching
}: Readonly<TextInputProps>): React.ReactElement {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const indicatorsVisible = isClearable || isPassword;

  React.useEffect(() => {
    if (!value) {
      setIsPasswordVisible(false);
    }
  }, [value]);

  return (
    <div className={`${className || ""} ${classes.textInput}`}>
      <input
        placeholder={isFetching ? "" : placeholder}
        onBlur={resetScrollOnBlur}
        value={isFetching ? "" : value}
        onChange={(localEvent: React.ChangeEvent<HTMLInputElement>) =>
          !isFetching && onInputChange(localEvent, onChange)
        }
        className={`${classes.textInput__input} commonInput`}
        disabled={disabled || isFetching}
        type={isPassword && !isPasswordVisible ? "password" : "text"}
        name={name}
        autoComplete={autoComplete}
      />
      {indicatorsVisible && value ? (
        <div className={classes.textInput__indicatorContainer}>
          {isClearable && (
            <div className={classes.textInput__indicator}>
              <ButtonIcon
                onClick={() => onClearInput(onChange)}
                iconName="close"
                iconSize="sm"
                background="ghost"
                isFetching={isFetching}
                preventDefault
              />
            </div>
          )}
          {isPassword && (
            <div className={classes.textInput__indicator}>
              <ButtonIcon
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                iconName={isPasswordVisible ? "hide" : "show"}
                iconSize="sm"
                background="ghost"
                isFetching={isFetching}
                preventDefault
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
