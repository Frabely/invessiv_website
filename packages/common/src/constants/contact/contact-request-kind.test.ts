import { describe, expect, it } from "vitest";
import {
  CONTACT_REQUEST_KIND,
  CONTACT_REQUEST_KINDS,
} from "@invessiv/common/constants/contact/contact-request-kind";

describe("CONTACT_REQUEST_KIND", () => {
  it("maps each kind to its persisted channel value", () => {
    expect(CONTACT_REQUEST_KIND).toEqual({
      DiscoveryCall: "discovery_call",
      ProjectRequest: "project_request",
      QuickContact: "quick_contact",
      LinkedInPostDelivery: "linkedin_post_delivery",
    });
  });
});

describe("CONTACT_REQUEST_KINDS", () => {
  it("contains the LinkedIn-post delivery channel without duplicates", () => {
    expect(CONTACT_REQUEST_KINDS).toContain("linkedin_post_delivery");
    expect(new Set(CONTACT_REQUEST_KINDS).size).toBe(
      CONTACT_REQUEST_KINDS.length,
    );
  });
});
