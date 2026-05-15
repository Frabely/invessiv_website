import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";
import { CONTACT_SUBMIT_ERROR_CODE } from "@/common/contracts/contact/submit/contact-submit-error-code";
import { CONTACT_VALIDATION_FIELD_ERROR_CODE } from "@/server/contact/validation/shared/contact-validation-field-error-code";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mapQuickContactToMailMock, sendMailMock } = vi.hoisted(() => ({
  mapQuickContactToMailMock: vi.fn(),
  sendMailMock: vi.fn(),
}));
const { persistQuickContactLeadMock } = vi.hoisted(() => ({
  persistQuickContactLeadMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/services/mail/templates/quick-contact-notification", () => ({
  mapQuickContactToMail: mapQuickContactToMailMock,
}));

vi.mock("@/server/services/mail/mail-service", () => ({
  sendMail: sendMailMock,
}));

vi.mock("@/server/db/contact/persist-quick-contact", () => ({
  persistQuickContactLead: persistQuickContactLeadMock,
}));

describe("submitQuickContactCommandHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CONTACT_MAIL_TO", "service@invessiv.com");
    persistQuickContactLeadMock.mockResolvedValue({ persisted: true });
  });

  it("returns validation errors from handler-side zod validation", async () => {
    const { submitQuickContactCommandHandler } =
      await import("@/server/contact/handlers/submit-quick-contact.command-handler");

    const result = await submitQuickContactCommandHandler(
      {
        consentAccepted: false,
        email: "invalid",
        displayName: "",
        kind: CONTACT_REQUEST_KIND.QuickContact,
        locale: "de",
        message: "",
      },
      "req_123",
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected validation failure");
    }
    expect(result.code).toBe(CONTACT_SUBMIT_ERROR_CODE.ValidationError);
    expect(result.fieldErrors?.email).toContain(
      CONTACT_VALIDATION_FIELD_ERROR_CODE.InvalidEmail,
    );
    expect(persistQuickContactLeadMock).not.toHaveBeenCalled();
    expect(mapQuickContactToMailMock).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("sends valid quick contact commands through the mail infrastructure", async () => {
    mapQuickContactToMailMock.mockResolvedValueOnce({
      html: "<p>mail</p>",
      subject: "Subject",
      text: "mail",
      to: "service@invessiv.com",
    });
    sendMailMock.mockResolvedValueOnce({ ok: true });

    const { submitQuickContactCommandHandler } =
      await import("@/server/contact/handlers/submit-quick-contact.command-handler");

    const result = await submitQuickContactCommandHandler(
      {
        consentAccepted: true,
        email: "max@example.com",
        displayName: "Max Mustermann",
        kind: CONTACT_REQUEST_KIND.QuickContact,
        locale: "de",
        message: "Kurze erste Anfrage.",
      },
      "req_123",
    );

    expect(result).toEqual({ ok: true });
    expect(persistQuickContactLeadMock).toHaveBeenCalledTimes(1);
    expect(mapQuickContactToMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it("still succeeds when the mail infrastructure fails", async () => {
    mapQuickContactToMailMock.mockResolvedValueOnce({
      html: "<p>mail</p>",
      subject: "Subject",
      text: "mail",
      to: "service@invessiv.com",
    });
    sendMailMock.mockResolvedValueOnce({
      ok: false,
      reason: CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable,
    });

    const { submitQuickContactCommandHandler } =
      await import("@/server/contact/handlers/submit-quick-contact.command-handler");

    const result = await submitQuickContactCommandHandler(
      {
        consentAccepted: true,
        email: "max@example.com",
        displayName: "Max Mustermann",
        kind: CONTACT_REQUEST_KIND.QuickContact,
        locale: "de",
        message: "Kurze erste Anfrage.",
      },
      "req_123",
    );

    expect(result).toEqual({ ok: true });
  });

  it("returns delivery unavailable when persistence throws", async () => {
    persistQuickContactLeadMock.mockRejectedValueOnce(new Error("db down"));

    const { submitQuickContactCommandHandler } =
      await import("@/server/contact/handlers/submit-quick-contact.command-handler");

    const result = await submitQuickContactCommandHandler(
      {
        consentAccepted: true,
        email: "max@example.com",
        displayName: "Max Mustermann",
        kind: CONTACT_REQUEST_KIND.QuickContact,
        locale: "de",
        message: "Kurze erste Anfrage.",
      },
      "req_123",
    );

    expect(result).toEqual({
      code: CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable,
      ok: false,
    });
  });
});
