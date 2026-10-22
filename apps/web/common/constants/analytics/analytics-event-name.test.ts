import { describe, expect, it } from "vitest";

import { ANALYTICS_EVENT_NAMES } from "./analytics-event-name";
import { AnalyticsCtaId } from "./analytics-cta-id";

describe("analytics constants", () => {
  it("keeps the stable event catalogue introduced with the analytics reset", () => {
    expect(ANALYTICS_EVENT_NAMES).toEqual([
      "section_reached",
      "page_engaged",
      "cta_clicked",
      "nav_clicked",
      "contact_channel_clicked",
      "option_selected",
      "reference_opened",
      "faq_opened",
      "form_started",
      "form_submitted",
      "form_invalid",
      "form_failed",
      "form_completed",
      "calendar_opened",
      "generator_step",
      "preference_changed",
    ]);
  });

  it("uses unique, snake_case CTA ids", () => {
    const ids = Object.values(AnalyticsCtaId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z]+(_[a-z]+)+$/);
    }
  });
});
