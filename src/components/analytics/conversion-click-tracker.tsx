"use client";

import { useEffect } from "react";
import {
  trackConversionEvent,
  type ConversionEventName,
  type ConversionEventPayload,
} from "@/lib/analytics/conversion-events";

function getContactTarget(href: string | null): string | undefined {
  if (!href) {
    return undefined;
  }
  const normalizedHref = href.toLowerCase();
  if (normalizedHref.startsWith("mailto:")) {
    return "email";
  }
  if (normalizedHref.startsWith("tel:")) {
    return "phone";
  }
  if (
    normalizedHref.includes("calendly.com") ||
    normalizedHref.includes("/calendly")
  ) {
    return "calendly";
  }
  if (
    normalizedHref.includes("wa.me/") ||
    normalizedHref.includes("whatsapp.com/")
  ) {
    return "whatsapp";
  }
  return undefined;
}

function getPayloadFromElement(
  element: HTMLElement,
  eventName: ConversionEventName,
): ConversionEventPayload {
  const payload: ConversionEventPayload = {};
  const location = element.dataset.analyticsLocation;
  const variant = element.dataset.analyticsVariant;
  const targetFromDataset = element.dataset.analyticsTarget;
  if (location) {
    payload.location = location;
  }
  if (variant) {
    payload.variant = variant;
  }
  if (targetFromDataset) {
    payload.target = targetFromDataset;
    return payload;
  }
  if (eventName === "contact_click") {
    const href =
      element instanceof HTMLAnchorElement ? element.getAttribute("href") : null;
    const contactTarget = getContactTarget(href);
    if (contactTarget) {
      payload.target = contactTarget;
    }
  }
  return payload;
}

export function ConversionClickTracker() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const trackedElement = target.closest<HTMLElement>("[data-analytics-event]");
      if (!trackedElement) {
        return;
      }

      const rawEventName = trackedElement.dataset.analyticsEvent;
      if (
        rawEventName !== "cta_click" &&
        rawEventName !== "contact_click"
      ) {
        return;
      }

      const eventName = rawEventName as ConversionEventName;
      const payload = getPayloadFromElement(trackedElement, eventName);
      trackConversionEvent(eventName, payload);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
