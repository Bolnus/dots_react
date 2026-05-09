import React from "react";
import classes from "./numberInput.module.scss";
import { NumberInputType } from "./types";

interface TextInputProps {
    value?: number;
    onChange?: (num: number | undefined) => void;
    isClearable?: boolean;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    type?: NumberInputType;
    requiredValue?: number;
}

export function resetScrollOnBlur(): void {
    window.scrollTo(0, 0);
}

function toNumberByType(text: string, type: NumberInputType): number | undefined {
    let regExp: RegExp;
    switch (type) {
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

export function toUnsigned(text: string): number | undefined {
    return toNumberByType(text, NumberInputType.Unsigned);
}

export function toInteger(text: string): number | undefined {
    return toNumberByType(text, NumberInputType.Interger);
}

export function toFloat(text: string): number | undefined {
    return toNumberByType(text, NumberInputType.Float);
}

function onInputChange(
    localEvent: React.ChangeEvent<HTMLInputElement>,
    type: NumberInputType,
    onChange?: (num: string) => void
) {
    localEvent.preventDefault();
    if (!onChange) {
        return;
    }
    const inputElement = localEvent.target;
    if (inputElement.value === "" || inputElement.value === undefined) {
        onChange("");
    } else if (typeof inputElement.value === "string") {
        switch (type) {
            case NumberInputType.Unsigned:
                if (/^\d*$/.test(inputElement.value)) {
                    onChange(inputElement.value);
                }
                break;
            case NumberInputType.Interger:
                if (/^-?\d*$/.test(inputElement.value)) {
                    onChange(inputElement.value);
                }
                break;
            case NumberInputType.Float:
                if (/^-?\d*(\.\d*)?$/.test(inputElement.value)) {
                    onChange(inputElement.value);
                }
                break;
            default:
                break;
        }
    }
}

function onClearInput(onChange?: (str: string) => void) {
    if (onChange) {
        onChange("");
    }
}

function onBlurLocal(
    value: string,
    inputType: NumberInputType,
    onChangeLocal: (str: string) => void,
    onChange?: (num: number | undefined) => void,
    requiredValue?: number
) {
    resetScrollOnBlur();
    if (!onChange) {
        return;
    }

    if (value === "") {
        if (requiredValue !== undefined) {
            onChange(requiredValue);
            onChangeLocal(String(requiredValue));
        } else {
            onChange(undefined);
        }
    } else {
        let numberValue: number | undefined;
        switch (inputType) {
            case NumberInputType.Unsigned:
                numberValue = toUnsigned(value);
                break;
            case NumberInputType.Interger:
                numberValue = toInteger(value);
                break;
            case NumberInputType.Float:
                numberValue = toFloat(value);
                break;
            default:
                break;
        }
        if (numberValue === undefined && requiredValue !== undefined) {
            onChange(requiredValue);
            onChangeLocal(String(requiredValue));
        } else {
            onChange(numberValue);
        }
    }
}

export function NumberInput({
    value,
    onChange,
    isClearable,
    className,
    disabled,
    placeholder,
    requiredValue,
    type = NumberInputType.Interger
}: Readonly<TextInputProps>): JSX.Element {
    const [localValue, setLocalValue] = React.useState("");

    React.useEffect(() => {
        setLocalValue(value?.toString() || "");
    }, [value]);

    return (
        <div className={`${className || ""} ${classes.textInput}`}>
            <input
                placeholder={placeholder}
                onBlur={() => onBlurLocal(localValue, type, setLocalValue, onChange, requiredValue)}
                value={localValue}
                onChange={(localEvent: React.ChangeEvent<HTMLInputElement>) =>
                    onInputChange(localEvent, type, setLocalValue)
                }
                className={`${classes.textInput__input} commonInput`}
                disabled={disabled}
                onFocus={(localEvent) => localEvent.currentTarget.select()}
            />
        </div>
    );
}
