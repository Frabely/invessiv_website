"use client";

import type { RefObject } from "react";
import { useEffect, useState } from "react";

/** Reports whether an element currently intersects the viewport. */
export function useElementInView(
  elementRef: RefObject<Element | null>,
  rootMargin = "0px",
): boolean {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry?.isIntersecting ?? false);
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, rootMargin]);

  return isInView;
}
