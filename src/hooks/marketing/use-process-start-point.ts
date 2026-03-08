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
    let rafId: number | null = null;
    const hasMatchMedia = typeof window.matchMedia === "function";

    const updatePoint = () => {
      const layoutRect = layout.getBoundingClientRect();
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

      const cardMetrics = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        const top = rect.top - layoutRect.top;
        const bottom = rect.bottom - layoutRect.top;
        const height = rect.height;
        const centerY = top + height / 2;
        const left = rect.left - layoutRect.left;
        const right = rect.right - layoutRect.left;
        const centerX = left + rect.width / 2;

        return {
          card,
          rect,
          top,
          bottom,
          centerY,
          left,
          right,
          centerX,
        };
      });
      const firstMetrics = cardMetrics[0];
      const lastMetrics = cardMetrics[cardMetrics.length - 1];
      if (!firstMetrics || !lastMetrics) {
        return;
      }
      const firstRect = firstMetrics.rect;
      const firstCenter = { x: firstMetrics.centerX, y: firstMetrics.centerY };
      const lastCenter = { x: lastMetrics.centerX, y: lastMetrics.centerY };
      const lastBottom = lastMetrics.bottom;
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
        ? window.matchMedia("(max-width: 1200px) and (min-width: 901px)")
            .matches
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
      const mobileLaneInset = 8;
      const mobileLaneOffset = Math.min(
        16,
        Math.max(10, layoutRect.width * 0.03),
      );
      const mobileCardAnchors = isMobileViewport
        ? cardMetrics.map((metrics) => {
            const center = { x: metrics.centerX, y: metrics.centerY };
            const leftGap = Math.max(0, metrics.left);
            const rightGap = Math.max(0, layoutRect.width - metrics.right);
            const leftLaneX = Math.max(
              mobileLaneInset,
              metrics.left - mobileLaneOffset,
            );
            const rightLaneX = Math.min(
              layoutRect.width - mobileLaneInset,
              metrics.right + mobileLaneOffset,
            );
            const prefersLeftLane = metrics.centerX > layoutRect.width / 2;
            const laneX =
              Math.abs(leftGap - rightGap) <= 2
                ? (prefersLeftLane ? leftLaneX : rightLaneX)
                : (leftGap >= rightGap ? leftLaneX : rightLaneX);

            return { center, laneX, leftLaneX, rightLaneX };
          })
        : null;
      const mobileStartAnchor = mobileCardAnchors?.[0];
      const mobileStartX = mobileStartAnchor?.laneX;
      setCssPoint(
        "--process-start-x",
        "--process-start-y",
        mobileStartX ?? mobileStartAnchor?.laneX ?? leftX,
        mobileStartAnchor?.center.y ?? firstCenter.y,
      );
      const ctaEndY = (() => {
        const ctaHeight = endCta?.getBoundingClientRect().height ?? 40;
        const ctaGap = 16;
        return lastBottom + ctaGap + ctaHeight / 2;
      })();
      const desktopEndX = layoutRect.width / 2;
      if (isMobileViewport) {
        setCssPoint(
          "--process-end-x",
          "--process-end-y",
          lastCenter.x,
          ctaEndY,
        );
      } else {
        setCssPoint("--process-end-x", "--process-end-y", desktopEndX, ctaEndY);
      }
      // Use the vertical midpoint of each gap between step cards.
      const spacingMidY = cardMetrics.slice(0, -1).map((metrics, index) => {
        const nextMetrics = cardMetrics[index + 1];
        if (!nextMetrics) {
          return null;
        }

        return metrics.bottom + (nextMetrics.top - metrics.bottom) / 2;
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

      const toPoint = (x: number, y: number) => `L ${x.toFixed(2)} ${y.toFixed(2)}`;
      let pathDefinition = "";

      if (isMobileViewport && mobileCardAnchors?.length) {
        const mobileSegments = [
          `M ${(mobileStartX ?? mobileCardAnchors[0].laneX).toFixed(2)} ${mobileCardAnchors[0].center.y.toFixed(2)}`,
        ];

        spacingMidY.forEach((midY, index) => {
          if (midY == null) {
            return;
          }

          const currentAnchor = mobileCardAnchors[index];
          const nextAnchor = mobileCardAnchors[index + 1];
          if (!currentAnchor || !nextAnchor) {
            return;
          }

          const currentLaneX =
            index === 0 ? (mobileStartX ?? currentAnchor.laneX) : currentAnchor.laneX;
          mobileSegments.push(toPoint(currentLaneX, midY));
          mobileSegments.push(toPoint(nextAnchor.laneX, midY));
          mobileSegments.push(toPoint(nextAnchor.laneX, nextAnchor.center.y));
        });

        const lastAnchor = mobileCardAnchors[mobileCardAnchors.length - 1];
        mobileSegments.push(toPoint(lastAnchor.laneX, ctaEndY));
        mobileSegments.push(toPoint(lastCenter.x, ctaEndY));
        pathDefinition = mobileSegments.join(" ");
      } else {
        const [spacing1, spacing2, spacing3] = spacingMidY;
        if (spacing1 == null || spacing2 == null || spacing3 == null) {
          return;
        }

        // Journey order: down, right, down, left, down, right, then to CTA endpoint.
        pathDefinition = [
          `M ${leftX.toFixed(2)} ${firstCenter.y.toFixed(2)}`,
          `L ${leftX.toFixed(2)} ${spacing1.toFixed(2)}`,
          `L ${rightX.toFixed(2)} ${spacing1.toFixed(2)}`,
          `L ${rightX.toFixed(2)} ${spacing2.toFixed(2)}`,
          `L ${leftX.toFixed(2)} ${spacing2.toFixed(2)}`,
          `L ${leftX.toFixed(2)} ${spacing3.toFixed(2)}`,
          `L ${rightX.toFixed(2)} ${spacing3.toFixed(2)}`,
          `L ${rightX.toFixed(2)} ${lastCenter.y.toFixed(2)}`,
          `L ${rightX.toFixed(2)} ${ctaEndY.toFixed(2)}`,
          `L ${desktopEndX.toFixed(2)} ${ctaEndY.toFixed(2)}`,
        ].join(" ");
      }
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
      const prefersReducedMotion = hasMatchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;
      const journeySpeedMultiplier = isMobileViewport
        ? Math.max(1.12, Math.min(1.32, viewportHeight / 680))
        : 1.3;
      // Start and end trigger lines tune when drawing begins and completes.
      const startLine = viewportHeight * (isMobileViewport ? 0.72 : 0.68);
      const endLine = viewportHeight * (isMobileViewport ? 0.26 : 0.5);
      const travelRange = rect.height + (startLine - endLine);
      const rawProgress =
        travelRange > 0 ? (startLine - rect.top) / travelRange : 0;
      const progress = prefersReducedMotion
        ? 1
        : Math.max(0, Math.min(1, rawProgress * journeySpeedMultiplier));
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
        const isCtaVisible =
          prefersReducedMotion || progress >= ctaRevealProgress;
        const isFinished =
          !prefersReducedMotion && progress >= ctaPulseProgress;
        leader.classList.toggle("is-finished", isFinished);
        if (endCta) {
          endCta.classList.toggle("is-journey-visible", isCtaVisible);
          endCta.classList.toggle("is-journey-active", isFinished);
        }
      }
    };

    const scheduleJourneyProgressUpdate = () => {
      if (rafId !== null) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateJourneyProgress();
      });
    };

    updatePoint();
    scheduleJourneyProgressUpdate();
    window.addEventListener("resize", updatePoint);
    window.addEventListener("resize", scheduleJourneyProgressUpdate);
    window.addEventListener("scroll", scheduleJourneyProgressUpdate, {
      passive: true,
    });
    return () => {
      window.removeEventListener("resize", updatePoint);
      window.removeEventListener("resize", scheduleJourneyProgressUpdate);
      window.removeEventListener("scroll", scheduleJourneyProgressUpdate);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [endCtaRef, layoutRef, leaderRef, pathRef, stepsRef]);
}
