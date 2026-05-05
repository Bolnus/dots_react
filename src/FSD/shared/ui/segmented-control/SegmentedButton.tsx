import type { ReactElement, ReactNode } from "react";

import { segmentedItemClassName } from "./SegmentedControl";

export type SegmentedButtonProps = Readonly<{
  active: boolean;
  onClick: () => void;
  pressed: boolean;
  children: ReactNode;
}>;

/** Button for `SegmentedControl` using shared active/inactive styles. */
export function SegmentedButton({ active, onClick, pressed, children }: SegmentedButtonProps): ReactElement {
  return (
    <button type="button" className={segmentedItemClassName(active)} onClick={onClick} aria-pressed={pressed}>
      {children}
    </button>
  );
}
