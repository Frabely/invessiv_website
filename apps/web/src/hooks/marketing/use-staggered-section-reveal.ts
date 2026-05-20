"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

type StaggeredSectionRevealOptions = {
  itemSelector?: string;
  staggerMs?: number;
};

export function useStaggeredSectionReveal(
  sectionRef: RefObject<HTMLElement | null>,
  dependencyKey: string,
  {
    itemSelector = "[data-reveal-item='true']",
    staggerMs = 80,
  }: StaggeredSectionRevealOptions = {},
) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const items = Array.from(
      section.querySelectorAll<HTMLElement>(itemSelector),
    );
    items.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${index * staggerMs}ms`);
    });

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => {
        item.dataset.visible = "true";
      });
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        items.forEach((item) => {
          item.dataset.visible = "true";
        });
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.18 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, [dependencyKey, itemSelector, sectionRef, staggerMs]);
}
