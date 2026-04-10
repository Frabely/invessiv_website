import { describe, expect, it } from "vitest";
import { contactSubmitSchema } from "@/features/contact/contact.schema";

const validBasePayload = {
  consentAccepted: true,
  email: "max@example.com",
  firstName: "Max",
  kind: "project_request",
  lastName: "Mustermann",
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

  it("rejects web payloads without pages or custom page names", () => {
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

  it("accepts web payloads with custom page names", () => {
    const parsed = contactSubmitSchema.safeParse({
      ...validBasePayload,
      customPageNames: ["Sponsoren"],
      offerKey: "web",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects web payloads with more than 12 custom pages", () => {
    const parsed = contactSubmitSchema.safeParse({
      ...validBasePayload,
      customPageNames: [
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
      ],
      offerKey: "web",
    });

    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.some((issue) => issue.message === "too_many_pages"),
    ).toBe(true);
  });

  it("accepts a valid quick contact payload", () => {
    const parsed = contactSubmitSchema.safeParse({
      consentAccepted: true,
      email: "max@example.com",
      firstName: "Max",
      kind: "quick_contact",
      lastName: "Mustermann",
      locale: "de",
      message: "Kurze erste Anfrage.",
    });

    expect(parsed.success).toBe(true);
  });
});
