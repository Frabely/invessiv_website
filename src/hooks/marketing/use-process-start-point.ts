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
      const layoutRect = layout.getBoundingClientRect();
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

      const firstRect = firstCard.getBoundingClientRect();
      const lastRect = lastCard.getBoundingClientRect();
      const firstCenter = centerInLayout(firstRect);
      const lastCenter = centerInLayout(lastRect);
      const upperWidth =
        upperCard?.getBoundingClientRect().width ?? firstRect.width;
      const startShift =
        (upperWidth - firstRect.width) / 4 + firstRect.width / 2;
      const leftX = firstCenter.x - startShift;
      const rightX = lastCenter.x + startShift;
      setCssPoint("--process-start-x", "--process-start-y", leftX, firstCenter.y);
      setCssPoint("--process-end-x", "--process-end-y", rightX, lastCenter.y);
      const spacingMidY = cards.slice(0, -1).map((card, index) => {
        const currentRect = card.getBoundingClientRect();
        const nextRect = cards[index + 1]?.getBoundingClientRect();
        if (!nextRect) {
          return null;
        }

        const currentBottom = currentRect.bottom - layoutRect.top;
        const nextTop = nextRect.top - layoutRect.top;
        return currentBottom + (nextTop - currentBottom) / 2;
      });

      spacingMidY.slice(0, 3).forEach((midY, index) => {
        if (midY == null) {
          return;
        }

        const pointIndex = index + 1;
        setCssPoint(
          `--process-left-point-${pointIndex}-x`,
          `--process-left-point-${pointIndex}-y`,
          leftX,
          midY,
        );
        setCssPoint(
          `--process-right-point-${pointIndex}-x`,
          `--process-right-point-${pointIndex}-y`,
          rightX,
          midY,
        );
      });
    };

    updatePoint();
    window.addEventListener("resize", updatePoint);
    return () => {
      window.removeEventListener("resize", updatePoint);
    };
  }, [layoutRef, stepsRef]);
}
