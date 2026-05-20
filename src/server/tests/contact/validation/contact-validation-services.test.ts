import { describe, expect, it } from "vitest";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import { LeadFieldLimits } from "@invessiv/common/constants/leads/forms/lead-field-limits";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import { CONTACT_VALIDATION_FIELD_ERROR_CODE } from "@/server/contact/validation/shared/contact-validation-field-error-code";
import { discoveryCallValidationService } from "@/server/contact/validation/discovery-call/discovery-call-validation-service";
import { projectRequestValidationService } from "@/server/contact/validation/project-request/project-request-validation-service";
import { quickContactValidationService } from "@/server/contact/validation/quick-contact/quick-contact-validation-service";

const validProjectRequestPayload = {
  consentAccepted: true,
  email: "max@example.com",
  displayName: "Max Mustermann",
  kind: CONTACT_REQUEST_KIND.ProjectRequest,
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

  it("accepts project details up to the lead notes limit", () => {
    const parsed = projectRequestValidationService.validate({
      ...validProjectRequestPayload,
      goalKey: "generate_inquiries",
      projectDetails: "x".repeat(LeadFieldLimits.NotesMaxLength),
    });

    expect(parsed.ok).toBe(true);
  });

  it("rejects project details longer than the lead notes limit", () => {
    const parsed = projectRequestValidationService.validate({
      ...validProjectRequestPayload,
      goalKey: "generate_inquiries",
      projectDetails: "x".repeat(LeadFieldLimits.NotesMaxLength + 1),
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("expected validation failure");
    }
    expect(parsed.fieldErrors.projectDetails).toContain(
      CONTACT_VALIDATION_FIELD_ERROR_CODE.TooLong,
    );
  });

  it("rejects missing conditional landing fields", () => {
    const parsed = projectRequestValidationService.validate(
      validProjectRequestPayload,
    );

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("expected validation failure");
    }
    expect(parsed.fieldErrors.goalKey).toContain(
      CONTACT_VALIDATION_FIELD_ERROR_CODE.GoalRequired,
    );
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
    expect(parsed.fieldErrors.pageKeys).toContain(
      CONTACT_VALIDATION_FIELD_ERROR_CODE.PagesRequired,
    );
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
    expect(parsed.fieldErrors.customPageNames).toContain(
      CONTACT_VALIDATION_FIELD_ERROR_CODE.TooManyPages,
    );
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
    expect(parsed.fieldErrors.pageKeys).toContain(
      CONTACT_VALIDATION_FIELD_ERROR_CODE.DuplicatePageKeys,
    );
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
      CONTACT_VALIDATION_FIELD_ERROR_CODE.DuplicateCustomPageNames,
    );
  });

  it("classifies spam trap hits as spam_detected", () => {
    const parsed = projectRequestValidationService.validate({
      ...validProjectRequestPayload,
      goalKey: "generate_inquiries",
      websiteTrap: "bot-filled",
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("expected validation failure");
    }
    expect(parsed.code).toBe(CONTACT_SUBMIT_ERROR_CODE.SpamDetected);
    expect(parsed.fieldErrors.websiteTrap).toContain(
      CONTACT_VALIDATION_FIELD_ERROR_CODE.SpamDetected,
    );
  });

  it("accepts a valid quick contact payload", () => {
    const parsed = quickContactValidationService.validate({
      consentAccepted: true,
      email: "max@example.com",
      displayName: "Max Mustermann",
      kind: CONTACT_REQUEST_KIND.QuickContact,
      locale: "de",
      message: "Kurze erste Anfrage.",
    });

    expect(parsed.ok).toBe(true);
  });

  it("accepts a valid discovery call payload", () => {
    const parsed = discoveryCallValidationService.validate({
      consentAccepted: true,
      email: "max@example.com",
      displayName: "Max Mustermann",
      kind: CONTACT_REQUEST_KIND.DiscoveryCall,
      locale: "de",
      message: "Wir wollen den Umfang kurz einordnen.",
    });

    expect(parsed.ok).toBe(true);
  });
});
