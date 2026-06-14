import { useEffect, useState, type Dispatch, type RefObject, type SetStateAction } from "react";

/** Resolves the intersection observer root from an optional ref or document body. */
function resolveObserverRoot(rootRef: RefObject<Element | null> | undefined): Element | null {
  return (rootRef?.current ?? (global.document && document.body)) || null;
}

/** Updates intersecting state when observer entries change. */
function handleIntersectionEntries(
  entries: IntersectionObserverEntry[],
  setIsIntersecting: Dispatch<SetStateAction<boolean>>
): void {
  setIsIntersecting(entries.some((entry) => entry.isIntersecting));
}

/** Observes a sentinel element and returns whether it intersects the root viewport. */
export function useIntersectionObserver({
  sentinelRef,
  rootRef,
  enabled,
  threshold = 0
}: {
  sentinelRef: RefObject<Element | null>;
  rootRef?: RefObject<Element | null>;
  enabled: boolean;
  threshold?: number;
}): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = resolveObserverRoot(rootRef);
    if (!sentinel || !root || !enabled) {
      setIsIntersecting(false);
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => handleIntersectionEntries(entries, setIsIntersecting), {
      root,
      threshold
    });

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      setIsIntersecting(false);
    };
  }, [sentinelRef, rootRef, enabled, threshold]);

  return isIntersecting;
}
