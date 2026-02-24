"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

type UseProcessStartPointParams = {
  layoutRef: RefObject<HTMLDivElement | null>;
  stepsRef: RefObject<HTMLDivElement | null>;
};

export function useProcessStartPoint({
  layoutRef,
  stepsRef,
}: UseProcessStartPointParams) {
  useEffect(() => {
    const layout = layoutRef.current;
    const steps = stepsRef.current;
    if (!layout || !steps) {
      return;
    }

    const updatePoint = () => {
      const centerInLayout = (rect: DOMRect) => ({
        x: rect.left - layoutRect.left + rect.width / 2,
        y: rect.top - layoutRect.top + rect.height / 2,
      });
      const setCssPoint = (
        xName: string,
        yName: string,
        x: number,
        y: number,
      ) => {
        layout.style.setProperty(xName, `${x.toFixed(2)}px`);
        layout.style.setProperty(yName, `${y.toFixed(2)}px`);
      };

      const cards = Array.from(
        steps.querySelectorAll<HTMLElement>(".process-step"),
      );
      const firstCard = cards[0];
      const lastCard = cards[cards.length - 1];
      const upperCard = layout
        .closest(".process-section")
        ?.querySelector<HTMLElement>(".process-intro");
      if (!firstCard || !lastCard) {
        return;
      }

      const layoutRect = layout.getBoundingClientRect();
      const firstRect = firstCard.getBoundingClientRect();
      const lastRect = lastCard.getBoundingClientRect();
      const firstCenter = centerInLayout(firstRect);
      const lastCenter = centerInLayout(lastRect);
      const upperWidth =
        upperCard?.getBoundingClientRect().width ?? firstRect.width;
      const startShift =
        (upperWidth - firstRect.width) / 4 + firstRect.width / 2;
      setCssPoint(
        "--process-start-x",
        "--process-start-y",
        firstCenter.x - startShift,
        firstCenter.y,
      );
      setCssPoint(
        "--process-end-x",
        "--process-end-y",
        lastCenter.x + startShift,
        lastCenter.y,
      );
    };

    updatePoint();
    window.addEventListener("resize", updatePoint);
    return () => {
      window.removeEventListener("resize", updatePoint);
    };
  }, [layoutRef, stepsRef]);
}
