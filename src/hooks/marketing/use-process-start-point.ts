"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

type UseProcessStartPointParams = {
  layoutRef: RefObject<HTMLDivElement | null>;
  endCtaRef: RefObject<HTMLAnchorElement | null>;
  leaderRef: RefObject<HTMLSpanElement | null>;
  pathRef: RefObject<SVGPathElement | null>;
  stepsRef: RefObject<HTMLDivElement | null>;
};

export function useProcessStartPoint({
  layoutRef,
  endCtaRef,
  leaderRef,
  pathRef,
  stepsRef,
}: UseProcessStartPointParams) {
  useEffect(() => {
    const ctaRevealProgress = 0.97;
    const ctaPulseProgress = 0.99;
    const endCta = endCtaRef.current;
    const layout = layoutRef.current;
    const leader = leaderRef.current;
    const path = pathRef.current;
    const steps = stepsRef.current;
    if (!layout || !leader || !path || !steps) {
      return;
    }
    let totalLength = 0;
    const hasMatchMedia = typeof window.matchMedia === "function";

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
      const lastBottom = lastRect.bottom - layoutRect.top;
      const horizontalViewWidth =
        upperCard?.getBoundingClientRect().width ?? layoutRect.width;
      // Keep the requested horizontal offset formula stable for both endpoints.
      const startShift =
        (horizontalViewWidth - firstRect.width) / 4 + firstRect.width / 2;
      const leftXRaw = firstCenter.x - startShift;
      const isMobileViewport = hasMatchMedia
        ? window.matchMedia("(max-width: 900px)").matches
        : false;
      const isTabletViewport = hasMatchMedia
        ? window.matchMedia("(max-width: 1200px) and (min-width: 901px)").matches
        : false;
      const edgePadding = 12;
      const leftX = Math.min(
        Math.max(leftXRaw, edgePadding),
        layoutRect.width - edgePadding,
      );
      const rightX = isMobileViewport
        ? layoutRect.width - leftX
        : (() => {
            const rightXRaw = lastCenter.x + startShift;
            const tabletNudgeLeft = isTabletViewport ? 10 : 0;
            const rightXTarget = rightXRaw - tabletNudgeLeft;
            const endCtaHalfWidth =
              (endCta?.getBoundingClientRect().width ?? 0) / 2;
            const rightXMin = endCtaHalfWidth + 12;
            const rightXMax = layoutRect.width - endCtaHalfWidth - 12;
            return Math.min(Math.max(rightXTarget, rightXMin), rightXMax);
          })();
      setCssPoint(
        "--process-start-x",
        "--process-start-y",
        leftX,
        firstCenter.y,
      );
      const mobileEndY = (() => {
        const ctaHeight = endCta?.getBoundingClientRect().height ?? 40;
        const ctaGap = 16;
        return lastBottom + ctaGap + ctaHeight / 2;
      })();
      if (isMobileViewport) {
        setCssPoint("--process-end-x", "--process-end-y", lastCenter.x, mobileEndY);
      } else {
        setCssPoint("--process-end-x", "--process-end-y", rightX, lastCenter.y);
      }
      // Use the vertical midpoint of each gap between step cards.
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

      const [spacing1, spacing2, spacing3] = spacingMidY;
      if (spacing1 == null || spacing2 == null || spacing3 == null) {
        return;
      }

      // Journey order: down, right, down, left, down, right, then to CTA endpoint.
      const pathDefinition = isMobileViewport
        ? [
            `M ${leftX.toFixed(2)} ${firstCenter.y.toFixed(2)}`,
            `L ${leftX.toFixed(2)} ${spacing1.toFixed(2)}`,
            `L ${rightX.toFixed(2)} ${spacing1.toFixed(2)}`,
            `L ${rightX.toFixed(2)} ${spacing2.toFixed(2)}`,
            `L ${leftX.toFixed(2)} ${spacing2.toFixed(2)}`,
            `L ${leftX.toFixed(2)} ${spacing3.toFixed(2)}`,
            `L ${rightX.toFixed(2)} ${spacing3.toFixed(2)}`,
            `L ${rightX.toFixed(2)} ${mobileEndY.toFixed(2)}`,
            `L ${lastCenter.x.toFixed(2)} ${mobileEndY.toFixed(2)}`,
          ].join(" ")
        : [
            `M ${leftX.toFixed(2)} ${firstCenter.y.toFixed(2)}`,
            `L ${leftX.toFixed(2)} ${spacing1.toFixed(2)}`,
            `L ${rightX.toFixed(2)} ${spacing1.toFixed(2)}`,
            `L ${rightX.toFixed(2)} ${spacing2.toFixed(2)}`,
            `L ${leftX.toFixed(2)} ${spacing2.toFixed(2)}`,
            `L ${leftX.toFixed(2)} ${spacing3.toFixed(2)}`,
            `L ${rightX.toFixed(2)} ${spacing3.toFixed(2)}`,
            `L ${rightX.toFixed(2)} ${lastCenter.y.toFixed(2)}`,
          ].join(" ");
      path.setAttribute("d", pathDefinition);

      const measuredLength = path.getTotalLength();
      if (Number.isFinite(measuredLength) && measuredLength > 0) {
        totalLength = measuredLength;
        path.style.strokeDasharray = `${totalLength}`;
        path.style.strokeDashoffset = `${totalLength}`;
        path.style.visibility = "visible";
        leader.style.visibility = "visible";
      }
    };

    const updateJourneyProgress = () => {
      const rect = layout.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isMobileViewport = hasMatchMedia
        ? window.matchMedia("(max-width: 900px)").matches
        : false;
      const journeySpeedMultiplier = isMobileViewport
        ? Math.max(1.12, Math.min(1.32, viewportHeight / 680))
        : 2;
      // Start and end trigger lines tune when drawing begins and completes.
      const startLine = viewportHeight * (isMobileViewport ? 0.72 : 0.68);
      const endLine = viewportHeight * (isMobileViewport ? 0.26 : 0.5);
      const travelRange = rect.height + (startLine - endLine);
      const rawProgress =
        travelRange > 0 ? (startLine - rect.top) / travelRange : 0;
      const progress = Math.max(
        0,
        Math.min(1, rawProgress * journeySpeedMultiplier),
      );
      if (totalLength > 0) {
        const drawnLength = totalLength * progress;
        path.style.strokeDashoffset = `${totalLength - drawnLength}`;
        const point = path.getPointAtLength(
          Math.max(0, Math.min(totalLength, drawnLength)),
        );
        layout.style.setProperty(
          "--process-leader-x",
          `${point.x.toFixed(2)}px`,
        );
        layout.style.setProperty(
          "--process-leader-y",
          `${point.y.toFixed(2)}px`,
        );
        const isCtaVisible = progress >= ctaRevealProgress;
        const isFinished = progress >= ctaPulseProgress;
        leader.classList.toggle("is-finished", isFinished);
        if (endCta) {
          endCta.classList.toggle("is-journey-visible", isCtaVisible);
          endCta.classList.toggle("is-journey-active", isFinished);
        }
      }
    };

    updatePoint();
    updateJourneyProgress();
    window.addEventListener("resize", updatePoint);
    window.addEventListener("resize", updateJourneyProgress);
    window.addEventListener("scroll", updateJourneyProgress, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePoint);
      window.removeEventListener("resize", updateJourneyProgress);
      window.removeEventListener("scroll", updateJourneyProgress);
    };
  }, [endCtaRef, layoutRef, leaderRef, pathRef, stepsRef]);
}
