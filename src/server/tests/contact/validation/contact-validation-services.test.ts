import { describe, expect, it } from "vitest";
import { discoveryCallValidationService } from "@/server/contact/validation/discovery-call/discovery-call-validation-service";
import { projectRequestValidationService } from "@/server/contact/validation/project-request/project-request-validation-service";
import { quickContactValidationService } from "@/server/contact/validation/quick-contact/quick-contact-validation-service";

const validProjectRequestPayload = {
  consentAccepted: true,
  email: "max@example.com",
  firstName: "Max",
  kind: "project_request",
  lastName: "Mustermann",
  locale: "de",
  offerKey: "landing",
  projectDetails:
    "Eine Landingpage fuer qualifizierte Leads mit klarer CTA-Struktur.",
  startedAt: "2026-03-20T10:00:00.000Z",
} as const;

describe("contact validation services", () => {
  it("accepts a valid landing project request", () => {
    const parsed = projectRequestValidationService.validate({
      ...validProjectRequestPayload,
      goalKey: "generate_inquiries",
    });

    expect(parsed.ok).toBe(true);
  });

  it("rejects missing conditional landing fields", () => {
    const parsed = projectRequestValidationService.validate(
      validProjectRequestPayload,
    );

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("expected validation failure");
    }
    expect(parsed.fieldErrors.goalKey).toContain("goal_required");
  });

  it("rejects web payloads without pages or custom page names", () => {
    const parsed = projectRequestValidationService.validate({
      ...validProjectRequestPayload,
      offerKey: "web",
      website: "https://example.com",
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("expected validation failure");
    }
    expect(parsed.fieldErrors.pageKeys).toContain("pages_required");
  });

  it("accepts web payloads with custom page names", () => {
    const parsed = projectRequestValidationService.validate({
      ...validProjectRequestPayload,
      customPageNames: ["Sponsoren"],
      offerKey: "web",
    });

    expect(parsed.ok).toBe(true);
  });

  it("rejects web payloads with more than 12 custom pages", () => {
    const parsed = projectRequestValidationService.validate({
      ...validProjectRequestPayload,
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

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("expected validation failure");
    }
    expect(parsed.fieldErrors.customPageNames).toContain("too_many_pages");
  });

  it("rejects duplicate page keys before persistence", () => {
    const parsed = projectRequestValidationService.validate({
      ...validProjectRequestPayload,
      offerKey: "web",
      pageKeys: ["home", "home"],
      website: "https://example.com",
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("expected validation failure");
    }
    expect(parsed.fieldErrors.pageKeys).toContain("duplicate_page_keys");
  });

  it("rejects duplicate custom page names before persistence", () => {
    const parsed = projectRequestValidationService.validate({
      ...validProjectRequestPayload,
      customPageNames: ["Sponsoren", "Sponsoren"],
      offerKey: "web",
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("expected validation failure");
    }
    expect(parsed.fieldErrors.customPageNames).toContain(
      "duplicate_custom_page_names",
    );
  });

  it("accepts a valid quick contact payload", () => {
    const parsed = quickContactValidationService.validate({
      consentAccepted: true,
      email: "max@example.com",
      firstName: "Max",
      kind: "quick_contact",
      lastName: "Mustermann",
      locale: "de",
      message: "Kurze erste Anfrage.",
    });

    expect(parsed.ok).toBe(true);
  });

  it("accepts a valid discovery call payload", () => {
    const parsed = discoveryCallValidationService.validate({
      consentAccepted: true,
      email: "max@example.com",
      firstName: "Max",
      kind: "discovery_call",
      lastName: "Mustermann",
      locale: "de",
      message: "Wir wollen den Umfang kurz einordnen.",
    });

    expect(parsed.ok).toBe(true);
  });
});
