"use client";

import { useEffect } from "react";

import {
  getAnchorScrollTop,
  getHashHref,
} from "@/lib/navigation/anchor-scroll";

function parsePixelValue(value: string) {
  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function resolveRootLengthPx(expression: string) {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.inset = "0 auto auto 0";
  probe.style.blockSize = "0";
  probe.style.paddingTop = expression;

  document.body.append(probe);
  const resolvedPixels = parsePixelValue(
    window.getComputedStyle(probe).paddingTop,
  );
  probe.remove();

  return resolvedPixels;
}

function getAnchorOffset() {
  const rootStyles = window.getComputedStyle(document.documentElement);
  const rawAnchorOffset = rootStyles
    .getPropertyValue("--anchor-scroll-offset")
    .trim();
  const resolvedAnchorOffset =
    resolveRootLengthPx("var(--anchor-scroll-offset)") ||
    (rawAnchorOffset ? resolveRootLengthPx(rawAnchorOffset) : 0) ||
    parsePixelValue(rawAnchorOffset);

  if (resolvedAnchorOffset > 0) {
    return Math.round(resolvedAnchorOffset);
  }

  const headerBottom =
    document.querySelector<HTMLElement>(".site-header")?.getBoundingClientRect()
      .bottom ?? 0;

  return Math.max(0, Math.round(headerBottom));
}

function scrollToHashTarget(hash: string, behavior: ScrollBehavior) {
  const targetId = decodeURIComponent(hash.slice(1));
  const targetElement = document.getElementById(targetId);
  if (!targetElement) {
    return false;
  }

  const targetTop = getAnchorScrollTop(
    targetElement.getBoundingClientRect().top,
    window.scrollY,
    getAnchorOffset(),
  );

  window.scrollTo({
    top: targetTop,
    behavior,
  });

  return true;
}

export function useAnchorOffsetScroll() {
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href^='#']");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const hash = getHashHref(anchor.getAttribute("href"));
      if (!hash) {
        return;
      }

      const didScroll = scrollToHashTarget(hash, "smooth");
      if (!didScroll) {
        return;
      }

      event.preventDefault();

      const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
      if (
        nextUrl !==
        window.location.pathname + window.location.search + window.location.hash
      ) {
        window.history.pushState(null, "", hash);
      }
    };

    const alignInitialHash = () => {
      const hash = getHashHref(window.location.hash);
      if (!hash) {
        return;
      }

      window.requestAnimationFrame(() => {
        scrollToHashTarget(hash, "auto");
      });
    };

    document.addEventListener("click", handleAnchorClick);
    alignInitialHash();

    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);
}
