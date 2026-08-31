import { describe, expect, it } from "vitest";
import {
  CONTACT_PROJECT_SCOPE,
  CONTACT_PROJECT_SCOPES,
  isContactProjectScope,
} from "@invessiv/common/constants/contact/contact-project-scopes";

describe("CONTACT_PROJECT_SCOPE", () => {
  it("maps each service model to its stable form value", () => {
    expect(CONTACT_PROJECT_SCOPE).toEqual({
      BusinessWebsite: "business_website",
      CompactWebsite: "compact_website",
      LandingPage: "landing_page",
      Unsure: "unsure",
    });
  });
});

describe("CONTACT_PROJECT_SCOPES", () => {
  it("lists the chip order without duplicates", () => {
    expect(CONTACT_PROJECT_SCOPES).toEqual([
      "unsure",
      "landing_page",
      "compact_website",
      "business_website",
    ]);
    expect(new Set(CONTACT_PROJECT_SCOPES).size).toBe(
      CONTACT_PROJECT_SCOPES.length,
    );
  });

  it("offers the low-commitment option first", () => {
    expect(CONTACT_PROJECT_SCOPES[0]).toBe(CONTACT_PROJECT_SCOPE.Unsure);
  });
});

describe("isContactProjectScope", () => {
  it("accepts every listed scope", () => {
    for (const scope of CONTACT_PROJECT_SCOPES) {
      expect(isContactProjectScope(scope)).toBe(true);
    }
  });

  it("rejects empty, unknown and non-string values", () => {
    expect(isContactProjectScope("")).toBe(false);
    expect(isContactProjectScope("maintenance")).toBe(false);
    expect(isContactProjectScope(undefined)).toBe(false);
    expect(isContactProjectScope(null)).toBe(false);
    expect(isContactProjectScope(0)).toBe(false);
  });
});
