import { describe, expect, it } from "vitest";

import {
  CONTACT_SECTION_ID,
  FAQ_SECTION_ID,
  HERO_SECTION_ID,
  PROCESS_SECTION_ID,
} from "./home";
import { LANDING_FUNNEL_SECTION_IDS, LANDING_SECTION_IDS } from "./landing";

describe("landing navigation constants", () => {
  it("keeps the funnel order explicit and stable", () => {
    expect(LANDING_FUNNEL_SECTION_IDS).toEqual([
      "hero",
      "solution",
      "trust",
      "audience",
      "process",
      "pricing",
      "reference",
      "faq",
      "contact",
    ]);
  });

  it("has no duplicate section ids", () => {
    expect(new Set(LANDING_FUNNEL_SECTION_IDS).size).toBe(
      LANDING_FUNNEL_SECTION_IDS.length,
    );
  });

  it("reuses the canonical anchors for the shared sections", () => {
    expect(LANDING_SECTION_IDS.hero).toBe(HERO_SECTION_ID);
    expect(LANDING_SECTION_IDS.process).toBe(PROCESS_SECTION_ID);
    expect(LANDING_SECTION_IDS.faq).toBe(FAQ_SECTION_ID);
    expect(LANDING_SECTION_IDS.contact).toBe(CONTACT_SECTION_ID);
  });
});
