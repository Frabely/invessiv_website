import { describe, expect, it } from "vitest";
import { contactSubmitSchema } from "@/features/contact/contact.schema";

const validBasePayload = {
  consentAccepted: true,
  email: "max@example.com",
  fullName: "Max Mustermann",
  locale: "de",
  offerKey: "landing",
  projectDetails:
    "Eine Landingpage für qualifizierte Leads mit klarer CTA-Struktur.",
  startedAt: "2026-03-20T10:00:00.000Z",
};

describe("contactSubmitSchema", () => {
  it("accepts a valid landing payload", () => {
    const parsed = contactSubmitSchema.safeParse({
      ...validBasePayload,
      goalKey: "generate_inquiries",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects missing conditional landing fields", () => {
    const parsed = contactSubmitSchema.safeParse(validBasePayload);

    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some((issue) => issue.message === "goal_required"),
    ).toBe(true);
  });

  it("rejects web payloads without pages or custom pages", () => {
    const parsed = contactSubmitSchema.safeParse({
      ...validBasePayload,
      offerKey: "web",
      website: "https://example.com",
    });

    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some((issue) => issue.message === "pages_required"),
    ).toBe(true);
  });
});
