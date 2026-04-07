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
    let isJourneyActive = true;
    let visibilityObserver: IntersectionObserver | null = null;

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
        steps.querySelectorAll<HTMLElement>("[data-process-step='true']"),
      );
      const firstCard = cards[0];
      const lastCard = cards[cards.length - 1];
      if (!firstCard || !lastCard) {
        return;
      }

      const stepsTopInLayout = steps.offsetTop;
      const cardMetrics = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        const top = stepsTopInLayout + card.offsetTop;
        const height = card.offsetHeight;
        const bottom = top + height;
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
      const horizontalViewWidth = layoutRect.width;
      // Keep the requested horizontal offset formula stable for both endpoints.
      const startShift =
        (horizontalViewWidth - firstRect.width) / 4 + firstRect.width / 2;
      const leftXRaw = firstCenter.x - startShift;
      const hasMatchMedia = typeof window.matchMedia === "function";
      const isMobileViewport = hasMatchMedia
        ? window.matchMedia("(max-width: 900px)").matches
        : false;
      const edgePadding = 12;
      const leftX = Math.min(
        Math.max(leftXRaw, edgePadding),
        layoutRect.width - edgePadding,
      );
      const mobileStartX = isMobileViewport
        ? Math.min(
            Math.max(firstMetrics.left / 2, edgePadding),
            layoutRect.width - edgePadding,
          )
        : leftX;
      const maxCardRight = cardMetrics.reduce(
        (currentMax, metrics) => Math.max(currentMax, metrics.right),
        0,
      );
      const contentViewportRight = layoutRect.width;
      const rightXRaw =
        maxCardRight + (contentViewportRight - maxCardRight) / 2;
      const rightX = Math.min(
        Math.max(rightXRaw, edgePadding),
        contentViewportRight - edgePadding,
      );
      setCssPoint(
        "--process-start-x",
        "--process-start-y",
        mobileStartX,
        firstCenter.y,
      );
      const ctaHeight = endCta?.getBoundingClientRect().height ?? 40;
      const ctaGap = isMobileViewport ? 24 : 16;
      const mobileLastBottom = lastMetrics.rect.bottom - layoutRect.top;
      const ctaAnchorBottom = isMobileViewport ? mobileLastBottom : lastBottom;
      const ctaEndY = ctaAnchorBottom + ctaGap + ctaHeight / 2;
      const desktopEndX = layoutRect.width / 2;
      setCssPoint("--process-end-x", "--process-end-y", desktopEndX, ctaEndY);
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
      if (isMobileViewport) {
        pathDefinition = [
          `M ${mobileStartX.toFixed(2)} ${firstCenter.y.toFixed(2)}`,
          `L ${mobileStartX.toFixed(2)} ${ctaEndY.toFixed(2)}`,
          `L ${desktopEndX.toFixed(2)} ${ctaEndY.toFixed(2)}`,
        ].join(" ");
      } else {
        const validSpacing = spacingMidY.filter(
          (midY): midY is number => midY != null,
        );
        if (validSpacing.length === 0) {
          return;
        }

        const segments = [`M ${leftX.toFixed(2)} ${firstCenter.y.toFixed(2)}`];
        let currentX = leftX;
        validSpacing.forEach((midY, index) => {
          segments.push(toPoint(currentX, midY));
          const targetX = index % 2 === 0 ? rightX : leftX;
          if (targetX !== currentX) {
            segments.push(toPoint(targetX, midY));
            currentX = targetX;
          }
        });
        segments.push(toPoint(currentX, lastCenter.y));
        segments.push(toPoint(currentX, ctaEndY));
        segments.push(toPoint(desktopEndX, ctaEndY));
        pathDefinition = segments.join(" ");
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
      const hasMatchMedia = typeof window.matchMedia === "function";
      const prefersReducedMotion = hasMatchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;
      // Start and end trigger lines tune when drawing begins and completes.
      const startLine = viewportHeight * 0.68;
      const endLine = viewportHeight * 0.5;
      const travelRange = rect.height + (startLine - endLine);
      const rawProgress =
        travelRange > 0 ? (startLine - rect.top) / travelRange : 0;
      const progress = prefersReducedMotion
        ? 1
        : Math.max(0, Math.min(1, rawProgress));
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
        leader.dataset.finished = isFinished ? "true" : "false";
        if (endCta) {
          endCta.dataset.journeyVisible = isCtaVisible ? "true" : "false";
          endCta.dataset.journeyActive = isFinished ? "true" : "false";
        }
      }
    };

    const scheduleJourneyProgressUpdate = () => {
      if (!isJourneyActive) {
        return;
      }
      if (rafId !== null) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateJourneyProgress();
      });
    };

    const handleScroll = () => {
      scheduleJourneyProgressUpdate();
    };

    if ("IntersectionObserver" in window) {
      isJourneyActive = false;
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) {
            return;
          }
          isJourneyActive = entry.isIntersecting;
          if (isJourneyActive) {
            updatePoint();
            scheduleJourneyProgressUpdate();
          }
        },
        {
          threshold: 0,
          rootMargin: "240px 0px 240px 0px",
        },
      );
      visibilityObserver.observe(layout);
    }

    updatePoint();
    scheduleJourneyProgressUpdate();
    window.addEventListener("resize", updatePoint);
    window.addEventListener("resize", scheduleJourneyProgressUpdate);
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    return () => {
      window.removeEventListener("resize", updatePoint);
      window.removeEventListener("resize", scheduleJourneyProgressUpdate);
      window.removeEventListener("scroll", handleScroll);
      visibilityObserver?.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [endCtaRef, layoutRef, leaderRef, pathRef, stepsRef]);
}
