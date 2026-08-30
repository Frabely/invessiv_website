"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

type UseProcessJourneyParams = {
  layoutRef: RefObject<HTMLDivElement | null>;
  endCtaRef: RefObject<HTMLAnchorElement | null>;
  leaderRef: RefObject<HTMLSpanElement | null>;
  maskRef: RefObject<SVGMaskElement | null>;
  pathRef: RefObject<SVGPathElement | null>;
  stepsRef: RefObject<HTMLDivElement | null>;
};

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

type CardAnchor = {
  card: HTMLElement;
  innerX: number;
  outerX: number;
  y: number;
  // Horizontal direction pointing into the free center column (+1 left column, -1 right column).
  dir: number;
};

const JOURNEY_STATES = {
  upcoming: "upcoming",
  active: "active",
  passed: "passed",
} as const;

export function useProcessJourney({
  layoutRef,
  endCtaRef,
  leaderRef,
  maskRef,
  pathRef,
  stepsRef,
}: UseProcessJourneyParams) {
  useEffect(() => {
    const ctaRevealProgress = 0.97;
    const ctaPulseProgress = 0.99;
    const endCta = endCtaRef.current;
    const layout = layoutRef.current;
    const leader = leaderRef.current;
    const mask = maskRef.current;
    const path = pathRef.current;
    const steps = stepsRef.current;
    if (!layout || !leader || !path || !steps) {
      return;
    }
    let totalLength = 0;
    let cards: HTMLElement[] = [];
    let cardLengths: number[] = [];
    let cardRects: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    }[] = [];
    let lastActiveIndex: number | null = null;
    let rafId: number | null = null;
    let isJourneyActive = true;
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

    const updateGeometry = () => {
      const layoutRect = layout.getBoundingClientRect();
      cards = Array.from(
        steps.querySelectorAll<HTMLElement>("[data-process-step='true']"),
      );
      if (cards.length === 0 || layoutRect.width === 0) {
        return;
      }

      const stepsTopInLayout = steps.offsetTop;
      const metrics = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        const top = stepsTopInLayout + card.offsetTop;
        const height = card.offsetHeight;
        const left = rect.left - layoutRect.left;
        const right = rect.right - layoutRect.left;

        return {
          card,
          top,
          bottom: top + height,
          centerY: top + height / 2,
          left,
          right,
          centerX: left + rect.width / 2,
        };
      });
      const lastMetrics = metrics[metrics.length - 1];
      const firstMetrics = metrics[0];
      if (!firstMetrics || !lastMetrics) {
        return;
      }
      cardRects = metrics.map((metric) => ({
        left: metric.left,
        right: metric.right,
        top: metric.top,
        bottom: metric.bottom,
      }));

      if (mask) {
        // Punch the card areas out of the path so it never shows through translucent cards.
        while (mask.firstChild) {
          mask.removeChild(mask.firstChild);
        }
        mask.setAttribute("x", "0");
        mask.setAttribute("y", "0");
        mask.setAttribute("width", `${Math.ceil(layoutRect.width)}`);
        mask.setAttribute("height", `${layout.offsetHeight}`);
        const baseRect = document.createElementNS(SVG_NAMESPACE, "rect");
        baseRect.setAttribute("x", "0");
        baseRect.setAttribute("y", "0");
        baseRect.setAttribute("width", `${Math.ceil(layoutRect.width)}`);
        baseRect.setAttribute("height", `${layout.offsetHeight}`);
        baseRect.setAttribute("fill", "#ffffff");
        mask.appendChild(baseRect);
        metrics.forEach((metric) => {
          const cardRect = document.createElementNS(SVG_NAMESPACE, "rect");
          const radius = Number.parseFloat(
            window.getComputedStyle(metric.card).borderTopLeftRadius,
          );
          cardRect.setAttribute("x", metric.left.toFixed(2));
          cardRect.setAttribute("y", metric.top.toFixed(2));
          cardRect.setAttribute(
            "width",
            (metric.right - metric.left).toFixed(2),
          );
          cardRect.setAttribute(
            "height",
            (metric.bottom - metric.top).toFixed(2),
          );
          cardRect.setAttribute(
            "rx",
            Number.isFinite(radius) ? `${radius}` : "18",
          );
          cardRect.setAttribute("fill", "#000000");
          mask.appendChild(cardRect);
        });
      }

      const hasMatchMedia = typeof window.matchMedia === "function";
      const isMobileViewport = hasMatchMedia
        ? window.matchMedia("(max-width: 900px)").matches
        : false;
      const edgePadding = 12;
      const ctaHeight = endCta?.getBoundingClientRect().height ?? 40;
      const ctaGap = isMobileViewport ? 28 : 40;
      const maxBottom = metrics.reduce(
        (currentMax, metric) => Math.max(currentMax, metric.bottom),
        0,
      );
      const ctaX = layoutRect.width / 2;
      const ctaY = maxBottom + ctaGap + ctaHeight / 2;

      const segments: string[] = [];
      const lengths: number[] = [];
      const measure = () => {
        path.setAttribute("d", segments.join(" "));
        return path.getTotalLength();
      };

      if (isMobileViewport) {
        const lineX = Math.min(
          Math.max(firstMetrics.left / 2, edgePadding),
          layoutRect.width - edgePadding,
        );
        segments.push(
          `M ${lineX.toFixed(2)} ${firstMetrics.centerY.toFixed(2)}`,
        );
        lengths.push(0);
        metrics.slice(1).forEach((metric) => {
          segments.push(`L ${lineX.toFixed(2)} ${metric.centerY.toFixed(2)}`);
          lengths.push(measure());
        });
        segments.push(`L ${lineX.toFixed(2)} ${ctaY.toFixed(2)}`);
        segments.push(`L ${ctaX.toFixed(2)} ${ctaY.toFixed(2)}`);
        setCssPoint(
          "--process-start-x",
          "--process-start-y",
          lineX,
          firstMetrics.centerY,
        );
      } else {
        const anchors: CardAnchor[] = metrics.map((metric) => {
          const isLeftColumn = metric.centerX < layoutRect.width / 2;
          return {
            card: metric.card,
            innerX: isLeftColumn ? metric.right : metric.left,
            outerX: isLeftColumn ? metric.left : metric.right,
            y: metric.centerY,
            dir: isLeftColumn ? 1 : -1,
          };
        });
        const leftEdge = anchors.reduce(
          (currentMax, anchor) =>
            anchor.dir === 1 ? Math.max(currentMax, anchor.innerX) : currentMax,
          0,
        );
        const rightEdge = anchors.reduce(
          (currentMin, anchor) =>
            anchor.dir === -1
              ? Math.min(currentMin, anchor.innerX)
              : currentMin,
          layoutRect.width,
        );
        const innerGap = Math.max(rightEdge - leftEdge, 0);
        const curveStrength = Math.min(Math.max(innerGap * 0.55, 48), 260);
        const sideSpace = Math.max(
          (window.innerWidth - layoutRect.width) / 2,
          0,
        );
        const outwardStrength = Math.min(Math.max(sideSpace * 0.8, 36), 110);

        const firstAnchor = anchors[0];
        if (!firstAnchor) {
          return;
        }
        segments.push(
          `M ${firstAnchor.innerX.toFixed(2)} ${firstAnchor.y.toFixed(2)}`,
        );
        lengths.push(0);
        let currentX = firstAnchor.innerX;
        anchors.slice(1).forEach((anchor, index) => {
          const previous = anchors[index];
          if (!previous) {
            return;
          }
          if (previous.dir !== anchor.dir) {
            // Column crossing: swing through the free center.
            if (currentX !== previous.innerX) {
              segments.push(
                `L ${previous.innerX.toFixed(2)} ${previous.y.toFixed(2)}`,
              );
            }
            const cp1x = previous.innerX + previous.dir * curveStrength;
            const cp2x = anchor.innerX + anchor.dir * curveStrength;
            // A same-row crossing would be dead straight; sag it slightly for an organic flow.
            const sag =
              Math.abs(anchor.y - previous.y) < 10
                ? Math.min(36, curveStrength * 0.16)
                : 0;
            segments.push(
              `C ${cp1x.toFixed(2)} ${(previous.y + sag).toFixed(2)} ${cp2x.toFixed(2)} ${(anchor.y + sag).toFixed(2)} ${anchor.innerX.toFixed(2)} ${anchor.y.toFixed(2)}`,
            );
            currentX = anchor.innerX;
          } else {
            // Same column: dive under the card and bow around its outer side.
            if (currentX !== previous.outerX) {
              segments.push(
                `L ${previous.outerX.toFixed(2)} ${previous.y.toFixed(2)}`,
              );
            }
            const cp1x = previous.outerX - previous.dir * outwardStrength;
            const cp2x = anchor.outerX - anchor.dir * outwardStrength;
            segments.push(
              `C ${cp1x.toFixed(2)} ${previous.y.toFixed(2)} ${cp2x.toFixed(2)} ${anchor.y.toFixed(2)} ${anchor.outerX.toFixed(2)} ${anchor.y.toFixed(2)}`,
            );
            currentX = anchor.outerX;
          }
          lengths.push(measure());
        });
        const lastAnchor = anchors[anchors.length - 1];
        if (lastAnchor) {
          // Dive under the last card and bow around its outer side down to the CTA.
          if (currentX !== lastAnchor.outerX) {
            segments.push(
              `L ${lastAnchor.outerX.toFixed(2)} ${lastAnchor.y.toFixed(2)}`,
            );
          }
          const cp1x = lastAnchor.outerX - lastAnchor.dir * outwardStrength;
          const cp2x = ctaX - lastAnchor.dir * Math.min(180, curveStrength);
          segments.push(
            `C ${cp1x.toFixed(2)} ${ctaY.toFixed(2)} ${cp2x.toFixed(2)} ${ctaY.toFixed(2)} ${ctaX.toFixed(2)} ${ctaY.toFixed(2)}`,
          );
        }
        setCssPoint(
          "--process-start-x",
          "--process-start-y",
          firstAnchor.innerX,
          firstAnchor.y,
        );
      }

      setCssPoint("--process-end-x", "--process-end-y", ctaX, ctaY);
      path.setAttribute("d", segments.join(" "));
      cardLengths = lengths;
      const measuredLength = path.getTotalLength();
      if (Number.isFinite(measuredLength) && measuredLength > 0) {
        totalLength = measuredLength;
        path.style.strokeDasharray = `${totalLength}`;
        path.style.strokeDashoffset = `${totalLength}`;
        path.style.visibility = "visible";
        leader.style.visibility = "visible";
      }
    };

    const applyCardStates = (activeIndex: number) => {
      if (lastActiveIndex === activeIndex) {
        return;
      }
      lastActiveIndex = activeIndex;
      cards.forEach((card, index) => {
        const state =
          index < activeIndex
            ? JOURNEY_STATES.passed
            : index === activeIndex
              ? JOURNEY_STATES.active
              : JOURNEY_STATES.upcoming;
        if (card.dataset.journeyState !== state) {
          card.dataset.journeyState = state;
        }
      });
    };

    const updateJourneyProgress = () => {
      const rect = layout.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const hasMatchMedia = typeof window.matchMedia === "function";
      const prefersReducedMotion = hasMatchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;
      // Start and end trigger lines tune when drawing begins and completes.
      const startLine = viewportHeight * 0.55;
      const endLine = viewportHeight * 0.78;
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
        // Hide the leader dot while it travels beneath a card, matching the masked path.
        const overCardInset = 6;
        const isOverCard = cardRects.some(
          (rect) =>
            point.x > rect.left + overCardInset &&
            point.x < rect.right - overCardInset &&
            point.y > rect.top + overCardInset &&
            point.y < rect.bottom - overCardInset,
        );
        leader.dataset.overCard = isOverCard ? "true" : "false";
        let activeIndex = -1;
        if (drawnLength > 0.5) {
          cardLengths.forEach((length, index) => {
            if (drawnLength + 1 >= length) {
              activeIndex = index;
            }
          });
        }
        applyCardStates(activeIndex);
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
            updateGeometry();
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

    updateGeometry();
    scheduleJourneyProgressUpdate();
    window.addEventListener("resize", updateGeometry);
    window.addEventListener("resize", scheduleJourneyProgressUpdate);
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    return () => {
      window.removeEventListener("resize", updateGeometry);
      window.removeEventListener("resize", scheduleJourneyProgressUpdate);
      window.removeEventListener("scroll", handleScroll);
      visibilityObserver?.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [endCtaRef, layoutRef, leaderRef, maskRef, pathRef, stepsRef]);
}
