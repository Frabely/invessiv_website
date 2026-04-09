import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mapContactToMailMock,
  getDatabaseClientMock,
  hasDatabaseConnectionStringMock,
  sendMailMock,
  sqlMock,
} = vi.hoisted(() => ({
  mapContactToMailMock: vi.fn(),
  getDatabaseClientMock: vi.fn(),
  hasDatabaseConnectionStringMock: vi.fn(),
  sendMailMock: vi.fn(),
  sqlMock: Object.assign(vi.fn(), {
    transaction: vi.fn(),
  }),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/db/client", () => ({
  getDatabaseClient: getDatabaseClientMock,
  hasDatabaseConnectionString: hasDatabaseConnectionStringMock,
}));

vi.mock("@/server/services/mail/mappers/map-contact-to-mail", () => ({
  mapContactToMail: mapContactToMailMock,
}));

vi.mock("@/server/services/mail/mail-service", () => ({
  sendMail: sendMailMock,
}));

describe("submitProjectRequestCommandHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CONTACT_MAIL_PROVIDER", "resend");
    vi.stubEnv("CONTACT_MAIL_TO", "service@invessiv.com");
    hasDatabaseConnectionStringMock.mockReturnValue(true);
    getDatabaseClientMock.mockReturnValue(sqlMock);
    sqlMock.mockReturnValue({});
    sqlMock.transaction.mockResolvedValue(undefined);
  });

  it("returns validation errors from handler-side zod validation", async () => {
    const { submitProjectRequestCommandHandler } =
      await import("@/server/contact/handlers/submit-project-request.command-handler");

    const result = await submitProjectRequestCommandHandler(
      {
        consentAccepted: false,
        email: "invalid",
        fullName: "",
        kind: "project_request",
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
    expect(sqlMock.transaction).not.toHaveBeenCalled();
    expect(mapContactToMailMock).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("persists project requests and marks the lead as sent after mail delivery", async () => {
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
        fullName: "Max Mustermann",
        goalKey: "generate_inquiries",
        kind: "project_request",
        locale: "de",
        offerKey: "landing",
        projectDetails: "Landingpage fuer qualifizierte Leads.",
        startedAt: "2026-04-10T10:00:00.000Z",
      },
      "req_123",
    );

    expect(result).toEqual({ ok: true });
    expect(sqlMock.transaction).toHaveBeenCalledTimes(1);
    expect(mapContactToMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sqlMock).toHaveBeenCalledTimes(3);
  });

  it("marks persisted leads as failed when mail delivery fails", async () => {
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
        fullName: "Max Mustermann",
        goalKey: "generate_inquiries",
        kind: "project_request",
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
    expect(sqlMock).toHaveBeenCalledTimes(3);
  });
});
