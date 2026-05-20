"use client";

import { useEffect } from "react";
import {
  isClickTrackedEventName,
  isConversionEventName,
  trackConversionEvent,
  type ConversionEventName,
  type ConversionEventPayload,
} from "@/lib/analytics/conversion-events";
import { getContactTarget } from "@/lib/analytics/get-contact-target";

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
      element instanceof HTMLAnchorElement
        ? element.getAttribute("href")
        : null;
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
      const trackedElement = target.closest<HTMLElement>(
        "[data-analytics-event]",
      );
      if (!trackedElement) {
        return;
      }

      const rawEventName = trackedElement.dataset.analyticsEvent;
      if (!isConversionEventName(rawEventName)) {
        return;
      }

      if (!isClickTrackedEventName(rawEventName)) {
        return;
      }

      const payload = getPayloadFromElement(trackedElement, rawEventName);
      trackConversionEvent(rawEventName, payload);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
