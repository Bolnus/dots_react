"use client";

import type { ReactElement } from "react";
import { useLayoutEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { THEME_DARK, THEME_LIGHT, THEME_STORAGE_KEY } from "@/FSD/shared/lib/theme/constants";
import { SegmentedControl } from "@/FSD/shared/ui/segmented-control/SegmentedControl";
import { SegmentedButton } from "@/FSD/shared/ui/segmented-control/SegmentedButton";

export type ThemeName = typeof THEME_LIGHT | typeof THEME_DARK;

const THEME_EVENT = "dots-theme-change";

const DATA_THEME_ATTR = "data-theme";

/** Reads the active palette from the document element (ThemeScript + user actions). */
function readThemeFromHtml(): ThemeName {
  const value = document.documentElement.getAttribute(DATA_THEME_ATTR);
  return value === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
}

/** Applies theme from a storage event and notifies listeners. */
function processThemeStorageUpdate(event: StorageEvent, onChange: () => void): void {
  if (event.key !== THEME_STORAGE_KEY || !event.newValue) {
    return;
  }
  const next = event.newValue === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
  document.documentElement.setAttribute(DATA_THEME_ATTR, next);
  onChange();
}

/** Subscribes to cross-tab localStorage updates and same-tab theme events. */
function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent): void => processThemeStorageUpdate(event, onChange);

  const onLocalTheme = (): void => onChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, onLocalTheme);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, onLocalTheme);
  };
}

/** Persists theme choice and notifies subscribers in this tab. */
function applyTheme(theme: ThemeName): void {
  document.documentElement.setAttribute(DATA_THEME_ATTR, theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore quota / private mode
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

/** Theme control: sets `data-theme` on `html` for global light/dark palettes. */
export function ThemeSwitcher(): ReactElement {
  const t = useTranslations("ThemeSwitcher");
  const [theme, setTheme] = useState<ThemeName>(THEME_DARK);

  useLayoutEffect(() => {
    queueMicrotask(() => setTheme(readThemeFromHtml()));
    return subscribe(() => setTheme(readThemeFromHtml()));
  }, []);

  const commitTheme = (next: ThemeName): void => {
    applyTheme(next);
    setTheme(next);
  };

  return (
    <SegmentedControl ariaLabel={t("label")}>
      <SegmentedButton
        active={theme === THEME_LIGHT}
        pressed={theme === THEME_LIGHT}
        onClick={() => commitTheme(THEME_LIGHT)}
      >
        {t("light")}
      </SegmentedButton>
      <SegmentedButton
        active={theme === THEME_DARK}
        pressed={theme === THEME_DARK}
        onClick={() => commitTheme(THEME_DARK)}
      >
        {t("dark")}
      </SegmentedButton>
    </SegmentedControl>
  );
}
