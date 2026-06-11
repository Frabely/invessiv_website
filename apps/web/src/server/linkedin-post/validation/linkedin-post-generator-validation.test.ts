import { describe, expect, it, vi } from "vitest";
import { CONTACT_FIELD_ERROR_CODE } from "@invessiv/common/constants/contact/contact-field-error-codes";
import {
  linkedinPostGeneratorRequestSchema,
  linkedinPostGeneratorValidationService,
} from "./linkedin-post-generator-validation";

const { mapGeneratorValidationErrors } = linkedinPostGeneratorValidationService;

vi.mock("server-only", () => ({}));

const VALID_REQUEST = {
  colorPairId: "auto",
  company: "",
  consent: true,
  displayName: "Max Mustermann",
  email: "max@example.com",
  expertise: "Strategieberatung",
  locale: "de",
  tone: "sachlich",
  topic: "Preisgespräche mit Bestandskunden",
};

describe("linkedinPostGeneratorRequestSchema", () => {
  it("accepts a valid generator request", () => {
    const result = linkedinPostGeneratorRequestSchema.safeParse(VALID_REQUEST);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email, consent, tone and color pair values", () => {
    const result = linkedinPostGeneratorRequestSchema.safeParse({
      ...VALID_REQUEST,
      colorPairId: "invalid",
      consent: false,
      email: "not-an-email",
      tone: "laut",
    });

    expect(result.success).toBe(false);
  });

  it("enforces the topic, expertise and optional display name length limits", () => {
    const result = linkedinPostGeneratorRequestSchema.safeParse({
      ...VALID_REQUEST,
      displayName: "x".repeat(81),
      expertise: "x".repeat(121),
      topic: "x".repeat(281),
    });

    expect(result.success).toBe(false);
  });

  it("accepts a missing display name and optional email", () => {
    const result = linkedinPostGeneratorRequestSchema.safeParse({
      ...VALID_REQUEST,
      consent: false,
      displayName: "",
      email: "",
    });

    expect(result.success).toBe(true);
  });
});

describe("mapGeneratorValidationErrors", () => {
  it("maps custom issues to their domain field error codes", () => {
    const result = linkedinPostGeneratorRequestSchema.safeParse({
      ...VALID_REQUEST,
      consent: false,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    const fieldErrors = mapGeneratorValidationErrors(result.error);
    expect(fieldErrors.email).toContain(CONTACT_FIELD_ERROR_CODE.InvalidEmail);
    expect(fieldErrors.consent).toContain(
      CONTACT_FIELD_ERROR_CODE.ConsentRequired,
    );
    expect(Object.values(fieldErrors).flat()).not.toContain("custom");
  });

  it("keeps native zod issue codes for non-custom issues", () => {
    const result = linkedinPostGeneratorRequestSchema.safeParse({
      ...VALID_REQUEST,
      topic: "",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    const fieldErrors = mapGeneratorValidationErrors(result.error);
    expect(fieldErrors.topic).toEqual(["too_small"]);
  });
});
