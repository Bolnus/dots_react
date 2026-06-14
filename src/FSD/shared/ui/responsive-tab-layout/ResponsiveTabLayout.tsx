"use client";

import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";

import { useMediaMinWidth } from "@/FSD/shared/lib/hooks/useMediaMinWidth";
import { ButtonIcon } from "@/FSD/shared/ui/button-icon/ButtonIcon";
import type { IconName } from "@/FSD/shared/ui/icon/IconTypes";

import styles from "./ResponsiveTabLayout.module.css";

type ResponsiveTabLayoutProps = Readonly<{
  primary: ReactNode;
  secondary: ReactNode;
  secondaryHeader?: ReactNode;
  openSecondaryIcon: Exclude<IconName, "fetching">;
  openPrimaryIcon: Exclude<IconName, "fetching">;
  openSecondaryAriaLabel: string;
  openPrimaryAriaLabel: string;
  breakpointPx?: number;
  onSecondaryVisibilityChange?: (visible: boolean) => void;
}>;

type ActiveTab = "primary" | "secondary";

type SecondaryHeaderProps = Readonly<{
  isWide: boolean;
  activeTab: ActiveTab;
  secondaryHeader?: ReactNode;
  openPrimaryIcon: Exclude<IconName, "fetching">;
  openPrimaryAriaLabel: string;
  onOpenPrimary: () => void;
}>;

/** Renders secondary panel header chrome for mobile and desktop layouts. */
function SecondaryHeaderChrome({
  isWide,
  activeTab,
  secondaryHeader,
  openPrimaryIcon,
  openPrimaryAriaLabel,
  onOpenPrimary
}: SecondaryHeaderProps): ReactElement | null {
  if (!isWide && activeTab === "secondary") {
    return (
      <div className={styles.secondaryMobileNav}>
        <ButtonIcon
          iconName={openPrimaryIcon}
          background="ghost"
          title={openPrimaryAriaLabel}
          onClick={onOpenPrimary}
        />
        {secondaryHeader ? <div className={styles.secondaryHeaderSlot}>{secondaryHeader}</div> : null}
      </div>
    );
  }
  if (isWide && secondaryHeader) {
    return <div className={styles.secondaryDesktopHeader}>{secondaryHeader}</div>;
  }
  return null;
}

/** Responsive two-panel layout: side-by-side on wide viewports, tabbed on narrow. */
export function ResponsiveTabLayout({
  primary,
  secondary,
  secondaryHeader,
  openSecondaryIcon,
  openPrimaryIcon,
  openSecondaryAriaLabel,
  openPrimaryAriaLabel,
  breakpointPx = 900,
  onSecondaryVisibilityChange
}: ResponsiveTabLayoutProps): ReactElement {
  const isWide = useMediaMinWidth(breakpointPx);
  const [activeTab, setActiveTab] = useState<ActiveTab>("primary");
  const isSecondaryVisible = isWide || activeTab === "secondary";

  useEffect(() => {
    onSecondaryVisibilityChange?.(isSecondaryVisible);
  }, [isSecondaryVisible, onSecondaryVisibilityChange]);

  const showPrimary = isWide || activeTab === "primary";
  const showSecondary = isWide || activeTab === "secondary";

  return (
    <div className={isWide ? styles.rootWide : styles.rootNarrow}>
      <div className={showPrimary ? styles.primarySlot : styles.hiddenSlot}>
        {primary}
        {!isWide && activeTab === "primary" ? (
          <div className={styles.openSecondaryToggle}>
            <ButtonIcon
              iconName={openSecondaryIcon}
              iconColor="#ef4444"
              background="ghost"
              title={openSecondaryAriaLabel}
              onClick={() => setActiveTab("secondary")}
            />
          </div>
        ) : null}
      </div>
      <div className={showSecondary ? styles.secondarySlot : styles.hiddenSlot}>
        <SecondaryHeaderChrome
          isWide={isWide}
          activeTab={activeTab}
          secondaryHeader={secondaryHeader}
          openPrimaryIcon={openPrimaryIcon}
          openPrimaryAriaLabel={openPrimaryAriaLabel}
          onOpenPrimary={() => setActiveTab("primary")}
        />
        <div className={styles.secondaryBody}>{secondary}</div>
      </div>
    </div>
  );
}
