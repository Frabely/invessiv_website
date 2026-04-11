import { beforeEach, describe, expect, it, vi } from "vitest";

const { mapContactToMailMock, sendMailMock } = vi.hoisted(() => ({
  mapContactToMailMock: vi.fn(),
  sendMailMock: vi.fn(),
}));
const { persistProjectRequestLeadMock } = vi.hoisted(() => ({
  persistProjectRequestLeadMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/services/mail/mappers/map-contact-to-mail", () => ({
  mapContactToMail: mapContactToMailMock,
}));

vi.mock("@/server/services/mail/mail-service", () => ({
  sendMail: sendMailMock,
}));

vi.mock("@/server/db/contact/persist-project-request", () => ({
  persistProjectRequestLead: persistProjectRequestLeadMock,
}));

describe("submitProjectRequestCommandHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CONTACT_MAIL_PROVIDER", "resend");
    vi.stubEnv("CONTACT_MAIL_TO", "service@invessiv.com");
    persistProjectRequestLeadMock.mockResolvedValue({ persisted: true });
  });

  it("returns validation errors from handler-side zod validation", async () => {
    const { submitProjectRequestCommandHandler } =
      await import("@/server/contact/handlers/submit-project-request.command-handler");

    const result = await submitProjectRequestCommandHandler(
      {
        consentAccepted: false,
        email: "invalid",
        firstName: "",
        kind: "project_request",
        lastName: "",
        locale: "de",
        offerKey: "landing",
        projectDetails: "Kurz",
        startedAt: "2026-04-10T10:00:00.000Z",
      },
      "req_123",
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected validation failure");
    }
    expect(result.code).toBe("validation_error");
    expect(result.fieldErrors?.email).toContain("invalid_email");
    expect(persistProjectRequestLeadMock).not.toHaveBeenCalled();
    expect(mapContactToMailMock).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("sends the project request mail after successful validation", async () => {
    mapContactToMailMock.mockResolvedValueOnce({
      html: "<p>mail</p>",
      subject: "Subject",
      text: "mail",
      to: "service@invessiv.com",
    });
    sendMailMock.mockResolvedValueOnce({ ok: true });

    const { submitProjectRequestCommandHandler } =
      await import("@/server/contact/handlers/submit-project-request.command-handler");

    const result = await submitProjectRequestCommandHandler(
      {
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        goalKey: "generate_inquiries",
        kind: "project_request",
        lastName: "Mustermann",
        locale: "de",
        offerKey: "landing",
        projectDetails: "Landingpage fuer qualifizierte Leads.",
        startedAt: "2026-04-10T10:00:00.000Z",
      },
      "req_123",
    );

    expect(result).toEqual({ ok: true });
    expect(persistProjectRequestLeadMock).toHaveBeenCalledTimes(1);
    expect(mapContactToMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it("returns the delivery error when mail delivery fails", async () => {
    mapContactToMailMock.mockResolvedValueOnce({
      html: "<p>mail</p>",
      subject: "Subject",
      text: "mail",
      to: "service@invessiv.com",
    });
    sendMailMock.mockResolvedValueOnce({
      ok: false,
      reason: "delivery_unavailable",
    });

    const { submitProjectRequestCommandHandler } =
      await import("@/server/contact/handlers/submit-project-request.command-handler");

    const result = await submitProjectRequestCommandHandler(
      {
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        goalKey: "generate_inquiries",
        kind: "project_request",
        lastName: "Mustermann",
        locale: "de",
        offerKey: "landing",
        projectDetails: "Landingpage fuer qualifizierte Leads.",
        startedAt: "2026-04-10T10:00:00.000Z",
      },
      "req_123",
    );

    expect(result).toEqual({
      code: "delivery_unavailable",
      ok: false,
    });
  });
});
