import { describe, expect, it } from "vitest";
import {
  CONTACT_SUBMISSION_ORIGIN_VALUES,
  ContactSubmissionOrigin,
} from "@invessiv/common/constants/contact/contact-submission-origin";

describe("ContactSubmissionOrigin", () => {
  it("maps each origin to its persisted string value", () => {
    expect(ContactSubmissionOrigin).toEqual({
      Website: "website",
      LinkedInPost: "linkedin_post",
    });
  });
});

describe("CONTACT_SUBMISSION_ORIGIN_VALUES", () => {
  it("lists every origin value without duplicates", () => {
    expect(CONTACT_SUBMISSION_ORIGIN_VALUES).toEqual([
      "website",
      "linkedin_post",
    ]);
    expect(new Set(CONTACT_SUBMISSION_ORIGIN_VALUES).size).toBe(
      CONTACT_SUBMISSION_ORIGIN_VALUES.length,
    );
  });
});
