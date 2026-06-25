"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

type UseProcessStartPointParams = {
  layoutRef: RefObject<HTMLDivElement | null>;
  headerRef: RefObject<HTMLDivElement | null>;
  endCtaRef: RefObject<HTMLAnchorElement | null>;
  leaderRef: RefObject<HTMLSpanElement | null>;
  pathRef: RefObject<SVGPathElement | null>;
  stepsRef: RefObject<HTMLOListElement | null>;
};

type JourneyPoint = {
  stepIndex: number | null;
  x: number;
  y: number;
};

// Turns an orthogonal polyline into a path string with softly rounded corners.
const buildRoundedPath = (points: JourneyPoint[], radius: number) => {
  if (points.length < 2) {
    return "";
  }
  const format = (value: number) => value.toFixed(2);
  const first = points[0];
  if (!first) {
    return "";
  }
  let definition = `M ${format(first.x)} ${format(first.y)}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    if (!previous || !corner || !next) {
      continue;
    }
    const inX = corner.x - previous.x;
    const inY = corner.y - previous.y;
    const outX = next.x - corner.x;
    const outY = next.y - corner.y;
    const inLength = Math.hypot(inX, inY);
    const outLength = Math.hypot(outX, outY);
    const cornerRadius = Math.min(radius, inLength / 2, outLength / 2);
    if (cornerRadius < 0.5 || inLength === 0 || outLength === 0) {
      definition += ` L ${format(corner.x)} ${format(corner.y)}`;
      continue;
    }
    const entryX = corner.x - (inX / inLength) * cornerRadius;
    const entryY = corner.y - (inY / inLength) * cornerRadius;
    const exitX = corner.x + (outX / outLength) * cornerRadius;
    const exitY = corner.y + (outY / outLength) * cornerRadius;
    definition += ` L ${format(entryX)} ${format(entryY)}`;
    definition += ` Q ${format(corner.x)} ${format(corner.y)} ${format(exitX)} ${format(exitY)}`;
  }
  const last = points[points.length - 1];
  if (last) {
    definition += ` L ${format(last.x)} ${format(last.y)}`;
  }
  return definition;
};

export function useProcessStartPoint({
  layoutRef,
  headerRef,
  endCtaRef,
  leaderRef,
  pathRef,
  stepsRef,
}: UseProcessStartPointParams) {
  useEffect(() => {
    const ctaRevealProgress = 0.86;
    const ctaPulseProgress = 0.94;
    const endCta = endCtaRef.current;
    const header = headerRef.current;
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
    let journeyStepCards: HTMLElement[] = [];
    let stepProgressStops: number[] = [];
    let visibilityObserver: IntersectionObserver | null = null;

    const setCssPoint = (
      xName: string,
      yName: string,
      x: number,
      y: number,
    ) => {
      layout.style.setProperty(xName, `${x.toFixed(2)}px`);
      layout.style.setProperty(yName, `${y.toFixed(2)}px`);
    };

    const updatePoint = () => {
      const layoutRect = layout.getBoundingClientRect();
      const cards = Array.from(
        steps.querySelectorAll<HTMLElement>("[data-process-step='true']"),
      );
      journeyStepCards = cards;
      if (cards.length === 0 || layoutRect.width === 0) {
        return;
      }

      const hasMatchMedia = typeof window.matchMedia === "function";
      const isStacked = hasMatchMedia
        ? !window.matchMedia("(min-width: 1024px)").matches
        : false;
      const isCompact = hasMatchMedia
        ? window.matchMedia("(max-width: 600px)").matches
        : false;
      const nodeGap = isStacked ? (isCompact ? 10 : 12) : 18;
      const cornerRadius = isStacked ? 10 : 14;
      const edgePadding = 10;
      const clampX = (x: number) =>
        Math.min(Math.max(x, edgePadding), layoutRect.width - edgePadding);

      const cardMetrics = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        const left = rect.left - layoutRect.left;
        const right = rect.right - layoutRect.left;
        const top = rect.top - layoutRect.top;
        const bottom = rect.bottom - layoutRect.top;
        return {
          card,
          left,
          right,
          top,
          bottom,
          centerY: top + rect.height / 2,
        };
      });

      // Each step's node hangs off the gutter-facing edge: left for every card
      // except the last (right), matching ProcessStepCard's `side`.
      const anchors = cardMetrics.map((metrics, index) => {
        const useRightAnchor = !isStacked && index === cardMetrics.length - 1;
        const x = clampX(
          useRightAnchor ? metrics.right + nodeGap : metrics.left - nodeGap,
        );
        return { x, y: metrics.centerY, metrics };
      });
      const firstAnchor = anchors[0];
      const lastAnchor = anchors[anchors.length - 1];
      const firstMetrics = cardMetrics[0];
      const lastMetrics = cardMetrics[cardMetrics.length - 1];
      if (!firstAnchor || !lastAnchor || !firstMetrics || !lastMetrics) {
        return;
      }

      // Path origin: flows out of the heading on desktop, drops from above the
      // first card on stacked layouts.
      let startX: number;
      let startY: number;
      if (!isStacked && header) {
        const headerRect = header.getBoundingClientRect();
        startX = clampX(headerRect.right - layoutRect.left);
        startY = headerRect.top - layoutRect.top + headerRect.height / 2;
      } else {
        const headerBottom = header
          ? header.getBoundingClientRect().bottom - layoutRect.top
          : 0;
        startX = firstAnchor.x;
        startY = Math.max(
          0,
          headerBottom + (firstMetrics.top - headerBottom) / 2,
        );
      }
      setCssPoint("--process-start-x", "--process-start-y", startX, startY);

      const ctaRect = endCta?.getBoundingClientRect();
      const ctaHeight = ctaRect?.height ?? 44;
      const ctaWidth = ctaRect?.width ?? 200;
      const ctaGap = isStacked ? 26 : 20;
      const ctaEndY = lastMetrics.bottom + ctaGap + ctaHeight / 2;
      const endX = isStacked
        ? layoutRect.width / 2
        : Math.min(
            Math.max(layoutRect.width * 0.74, edgePadding + ctaWidth / 2),
            layoutRect.width - edgePadding - ctaWidth / 2,
          );
      setCssPoint("--process-end-x", "--process-end-y", endX, ctaEndY);

      const points: JourneyPoint[] = [];
      const addPoint = (x: number, y: number, stepIndex?: number) => {
        points.push({ stepIndex: stepIndex ?? null, x, y });
      };
      // Mid-point of the vertical gap between two stacked cards (with a
      // fallback when they overlap), used to route the orthogonal staircase.
      const routeYBetween = (
        upper: { bottom: number },
        lower: { top: number },
      ) => {
        const gap = lower.top - upper.bottom;
        const fallbackGap = Math.min(46, layoutRect.height * 0.04);
        return gap > 0 ? upper.bottom + gap * 0.5 : upper.bottom + fallbackGap;
      };

      const node1 = anchors[0];
      const node2 = anchors[1];
      const node3 = anchors[2];
      const node4 = anchors[3];

      addPoint(startX, startY);
      if (isStacked) {
        anchors.forEach((anchor, index) => {
          addPoint(anchor.x, anchor.y, index);
        });
      } else if (anchors.length === 4 && node1 && node2 && node3 && node4) {
        // Desktop signature: a staircase into node 2, then the connector loops
        // around card 3, runs down through node 3, and crosses back over its
        // own "under card 3" segment on the way to node 4.
        addPoint(node1.x, startY);
        addPoint(node1.x, node1.y, 0);
        const routeY12 = routeYBetween(node1.metrics, node2.metrics);
        addPoint(node1.x, routeY12);
        addPoint(node2.x, routeY12);
        addPoint(node2.x, node2.y, 1);

        const wrapGap = Math.min(26, layoutRect.height * 0.025);
        const wrapTopY = node3.metrics.top - wrapGap;
        const wrapBotY = node3.metrics.bottom + wrapGap;
        const wrapRightX = clampX(node3.metrics.right + nodeGap);
        addPoint(node2.x, wrapBotY); // drop down the far-left edge
        addPoint(wrapRightX, wrapBotY); // run under card 3 (this gets crossed)
        addPoint(wrapRightX, wrapTopY); // up card 3's right edge
        addPoint(node3.x, wrapTopY); // back over the top to the gutter
        addPoint(node3.x, node3.y, 2); // down into node 3, passing through it
        addPoint(node4.x, node4.y, 3); // continue down → crosses the under run
      } else {
        // Fallback orthogonal staircase for any other card count.
        addPoint(firstAnchor.x, startY);
        anchors.forEach((anchor, index) => {
          addPoint(anchor.x, anchor.y, index);
          const nextAnchor = anchors[index + 1];
          if (!nextAnchor) {
            return;
          }
          const routeY = routeYBetween(anchor.metrics, nextAnchor.metrics);
          addPoint(anchor.x, routeY);
          addPoint(nextAnchor.x, routeY);
        });
      }
      addPoint(lastAnchor.x, ctaEndY);
      addPoint(endX, ctaEndY);

      path.setAttribute("d", buildRoundedPath(points, cornerRadius));
      const measuredLength = path.getTotalLength();
      if (!Number.isFinite(measuredLength) || measuredLength <= 0) {
        return;
      }
      totalLength = measuredLength;

      // Progress stop for each step, as a fraction of the polyline length.
      let polylineLength = 0;
      const cumulativeAtPoint: number[] = [0];
      points.slice(1).forEach((point, index) => {
        const previous = points[index];
        if (!previous) {
          return;
        }
        polylineLength += Math.hypot(
          point.x - previous.x,
          point.y - previous.y,
        );
        cumulativeAtPoint.push(polylineLength);
      });
      const nextProgressStops = Array.from({ length: cards.length }, () => 1);
      points.forEach((point, index) => {
        if (point.stepIndex == null) {
          return;
        }
        nextProgressStops[point.stepIndex] =
          polylineLength > 0
            ? (cumulativeAtPoint[index] ?? polylineLength) / polylineLength
            : 0;
      });
      stepProgressStops = nextProgressStops;

      journeyStepCards.forEach((card) => {
        card.dataset.journeyState = "pending";
      });
      path.style.strokeDasharray = `${totalLength}`;
      path.style.strokeDashoffset = `${totalLength}`;
      path.style.visibility = "visible";
      leader.style.visibility = "visible";
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
      const endLine = viewportHeight * 0.72;
      const travelRange = rect.height + (startLine - endLine);
      const rawProgress =
        travelRange > 0 ? (startLine - rect.top) / travelRange : 0;
      const progress = prefersReducedMotion
        ? 1
        : Math.max(0, Math.min(1, rawProgress));
      const updateStepStates = () => {
        if (journeyStepCards.length === 0 || stepProgressStops.length === 0) {
          return;
        }

        if (prefersReducedMotion && progress >= 1) {
          journeyStepCards.forEach((card) => {
            card.dataset.journeyState = "complete";
          });
          return;
        }

        const activeIndex = stepProgressStops.reduce(
          (currentActiveIndex, stopProgress, index) =>
            progress + 0.004 >= stopProgress ? index : currentActiveIndex,
          -1,
        );

        journeyStepCards.forEach((card, index) => {
          let state = "pending";
          if (index < activeIndex) {
            state = "complete";
          } else if (index === activeIndex) {
            state = "active";
          }
          card.dataset.journeyState = state;
        });
      };
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
        updateStepStates();
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
  }, [endCtaRef, headerRef, layoutRef, leaderRef, pathRef, stepsRef]);
}
