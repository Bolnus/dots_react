import { useEffect, useState } from "react";

/** Returns whether the viewport width is at or above the given breakpoint. */
export function useMediaMinWidth(breakpointPx: number): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const update = (): void => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [breakpointPx]);

  return matches;
}
