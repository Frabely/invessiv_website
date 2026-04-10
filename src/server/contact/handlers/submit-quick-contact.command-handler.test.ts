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

vi.mock("@/server/services/contact/persist-contact-lead", () => ({
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
        firstName: "",
        kind: "quick_contact",
        lastName: "",
        locale: "de",
        message: "",
      },
      "req_123",
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected validation failure");
    }
    expect(result.code).toBe("validation_error");
    expect(result.fieldErrors?.email).toContain("invalid_email");
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
        firstName: "Max",
        kind: "quick_contact",
        lastName: "Mustermann",
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

  it("returns delivery errors from the mail infrastructure", async () => {
    mapQuickContactToMailMock.mockResolvedValueOnce({
      html: "<p>mail</p>",
      subject: "Subject",
      text: "mail",
      to: "service@invessiv.com",
    });
    sendMailMock.mockResolvedValueOnce({
      ok: false,
      reason: "delivery_unavailable",
    });

    const { submitQuickContactCommandHandler } =
      await import("@/server/contact/handlers/submit-quick-contact.command-handler");

    const result = await submitQuickContactCommandHandler(
      {
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        kind: "quick_contact",
        lastName: "Mustermann",
        locale: "de",
        message: "Kurze erste Anfrage.",
      },
      "req_123",
    );

    expect(result).toEqual({
      code: "delivery_unavailable",
      ok: false,
    });
  });
});
