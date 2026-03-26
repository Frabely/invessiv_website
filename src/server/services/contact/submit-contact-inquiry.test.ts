import { beforeEach, describe, expect, it, vi } from "vitest";

const { markLeadMailStatusMock, persistContactLeadMock, sendMailMock } =
  vi.hoisted(() => ({
    markLeadMailStatusMock: vi.fn(),
    persistContactLeadMock: vi.fn(),
    sendMailMock: vi.fn(),
  }));

vi.mock("server-only", () => ({}));

vi.mock("@/server/db/contact-leads", () => ({
  persistContactLead: persistContactLeadMock,
  updateContactLeadMailStatus: markLeadMailStatusMock,
}));

vi.mock("@/server/services/mail/mail-service", () => ({
  sendMail: sendMailMock,
}));

describe("submitContactInquiry", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("CONTACT_MAIL_PROVIDER", "resend");
    vi.stubEnv("CONTACT_MAIL_FROM", "Invessiv <noreply@invessiv.com>");
    vi.stubEnv("CONTACT_MAIL_TO", "service@invessiv.com");
    vi.stubEnv("RESEND_API_KEY", "resend_test_key");
  });

  it("persists the lead first and marks the record as sent after mail delivery", async () => {
    persistContactLeadMock.mockResolvedValue({
      leadId: "lead_123",
      persisted: true,
    });
    markLeadMailStatusMock.mockResolvedValue(undefined);
    sendMailMock.mockResolvedValue({
      ok: true,
    });

    const { submitContactInquiry } =
      await import("@/server/services/contact/submit-contact-inquiry");

    const result = await submitContactInquiry(
      {
        budgetKey: undefined,
        company: undefined,
        consentAccepted: true,
        email: "max@example.com",
        fullName: "Max Mustermann",
        goalKey: "generate_inquiries",
        locale: "de",
        offerKey: "landing",
        pagesCustom: undefined,
        pageKeys: undefined,
        phone: undefined,
        preferredStartKey: undefined,
        projectDetails: "Eine Landingpage für qualifizierte Leads.",
        role: undefined,
        startedAt: "2026-03-26T09:00:00.000Z",
        website: undefined,
        websiteTrap: undefined,
        workflowKey: undefined,
      },
      "request_123",
    );

    expect(result).toEqual({ ok: true });
    expect(persistContactLeadMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(markLeadMailStatusMock).toHaveBeenCalledTimes(1);
    expect(markLeadMailStatusMock).toHaveBeenCalledWith("lead_123", "sent");
  });

  it("marks the lead as failed when mail delivery fails", async () => {
    persistContactLeadMock.mockResolvedValue({
      leadId: "lead_123",
      persisted: true,
    });
    markLeadMailStatusMock.mockResolvedValue(undefined);
    sendMailMock.mockResolvedValue({
      ok: false,
      reason: "delivery_unavailable",
    });

    const { submitContactInquiry } =
      await import("@/server/services/contact/submit-contact-inquiry");

    const result = await submitContactInquiry(
      {
        budgetKey: undefined,
        company: undefined,
        consentAccepted: true,
        email: "max@example.com",
        fullName: "Max Mustermann",
        goalKey: "generate_inquiries",
        locale: "de",
        offerKey: "landing",
        pagesCustom: undefined,
        pageKeys: undefined,
        phone: undefined,
        preferredStartKey: undefined,
        projectDetails: "Eine Landingpage für qualifizierte Leads.",
        role: undefined,
        startedAt: "2026-03-26T09:00:00.000Z",
        website: undefined,
        websiteTrap: undefined,
        workflowKey: undefined,
      },
      "request_123",
    );

    expect(result).toEqual({
      code: "delivery_unavailable",
      ok: false,
    });
    expect(markLeadMailStatusMock).toHaveBeenCalledTimes(1);
    expect(markLeadMailStatusMock).toHaveBeenCalledWith(
      "lead_123",
      "failed",
      "delivery_unavailable",
    );
  });

  it("persists disabled mail-provider metadata when delivery is unavailable by configuration", async () => {
    vi.stubEnv("CONTACT_MAIL_PROVIDER", "disabled");

    persistContactLeadMock.mockResolvedValue({
      leadId: "lead_123",
      persisted: true,
    });
    markLeadMailStatusMock.mockResolvedValue(undefined);
    sendMailMock.mockResolvedValue({
      ok: false,
      reason: "delivery_unavailable",
    });

    const { submitContactInquiry } =
      await import("@/server/services/contact/submit-contact-inquiry");

    await submitContactInquiry(
      {
        budgetKey: undefined,
        company: undefined,
        consentAccepted: true,
        email: "max@example.com",
        fullName: "Max Mustermann",
        goalKey: "generate_inquiries",
        locale: "de",
        offerKey: "landing",
        pagesCustom: undefined,
        pageKeys: undefined,
        phone: undefined,
        preferredStartKey: undefined,
        projectDetails: "Eine Landingpage fÃ¼r qualifizierte Leads.",
        role: undefined,
        startedAt: "2026-03-26T09:00:00.000Z",
        website: undefined,
        websiteTrap: undefined,
        workflowKey: undefined,
      },
      "request_123",
    );

    expect(persistContactLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        lead: expect.objectContaining({
          mailProvider: "disabled",
        }),
      }),
    );
  });
});
