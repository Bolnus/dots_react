"use client";

import type { Dispatch, ReactElement, RefObject, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";

import { ButtonIcon } from "@/FSD/shared/ui/button-icon/ButtonIcon";

import styles from "./AppHeaderControls.module.css";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

/** Returns the next open/closed value for the controls dropdown toggle. */
function getNextOpenState(current: boolean): boolean {
  return !current;
}

/** Class list for the dropdown panel based on whether it is expanded. */
function getHeaderControlsDropdownClassName(isOpen: boolean, dropdownClass: string, openClass: string): string {
  if (isOpen) {
    return `${dropdownClass} ${openClass}`;
  }
  return dropdownClass;
}

/** Closes the menu when the user presses outside the controls root while it is open. */
function onPointerDown(
  event: PointerEvent,
  isOpen: boolean,
  rootRef: RefObject<HTMLDivElement | null>,
  setIsOpen: Dispatch<SetStateAction<boolean>>
): void {
  if (!isOpen) {
    return;
  }
  const rootNode = rootRef.current;
  const { target } = event;
  if (!rootNode || !(target instanceof Node)) {
    return;
  }
  if (!rootNode.contains(target)) {
    setIsOpen(false);
  }
}

/** Interactive header controls with adaptive dropdown for small screens. */
export function AppHeaderControls(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handlePointerDown = (event: PointerEvent): void => onPointerDown(event, isOpen, rootRef, setIsOpen);
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [isOpen]);

  const dropdownClassName = getHeaderControlsDropdownClassName(
    isOpen,
    styles.controlsDropdown,
    styles.controlsDropdownOpen
  );

  return (
    <div ref={rootRef} className={styles.controlsRoot}>
      <div className={styles.menuTrigger}>
        <ButtonIcon
          aria-label="Open controls"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          iconName="hamburger"
          onClick={() => setIsOpen(getNextOpenState)}
        />
      </div>

      <div className={dropdownClassName}>
        <ThemeSwitcher />
        <LocaleSwitcher />
      </div>
    </div>
  );
}
