"use client";
import React from "react";
import classes from "./TextInput.module.scss";
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

function onInputChange(localEvent: React.ChangeEvent<HTMLInputElement>, onChange?: (str: string) => void) {
  localEvent.preventDefault();
  if (onChange) {
    const inputElement = localEvent.target;
    onChange(inputElement.value);
  }
}

function onClearInput(onChange?: (str: string) => void) {
  if (onChange) {
    onChange("");
  }
}

export function TextInput({
  value,
  onChange,
  isClearable,
  className,
  disabled,
  placeholder,
  isPassword,
  name,
  autoComplete,
  isFetching
}: Readonly<TextInputProps>): JSX.Element {
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
          <span className={classes.textInput__spacer} />
          {isClearable && (
            <div className={classes.textInput__indicator}>
              <ButtonIcon
                onClick={() => onClearInput(onChange)}
                iconName="close"
                size={UiSize.sm}
                color="var(--fontColorFirm)"
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
                iconSize={UiSize.sm}
                color="var(--fontColorFirm)"
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
