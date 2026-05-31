import { describe, expect, it, vi } from "vitest";
import { linkedinPostGeneratorRequestSchema } from "./linkedin-post-generator-validation";

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

  it("enforces the topic, expertise and display name length limits", () => {
    const result = linkedinPostGeneratorRequestSchema.safeParse({
      ...VALID_REQUEST,
      displayName: "x".repeat(81),
      expertise: "x".repeat(121),
      topic: "x".repeat(281),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing display name", () => {
    const result = linkedinPostGeneratorRequestSchema.safeParse({
      ...VALID_REQUEST,
      displayName: "",
    });

    expect(result.success).toBe(false);
  });
});
