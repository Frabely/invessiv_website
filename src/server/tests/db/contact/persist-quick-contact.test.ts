import { describe, expect, it, vi } from "vitest";

const { getDatabaseClientMock, hasDatabaseConnectionStringMock } = vi.hoisted(
  () => ({
    getDatabaseClientMock: vi.fn(),
    hasDatabaseConnectionStringMock: vi.fn(),
  }),
);

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/client", () => ({
  getDatabaseClient: getDatabaseClientMock,
  hasDatabaseConnectionString: hasDatabaseConnectionStringMock,
}));

describe("persistQuickContactLead", () => {
  it("executes one query with shared lead and submission CTEs", async () => {
    const queryMock = vi.fn().mockResolvedValue([]);
    getDatabaseClientMock.mockReturnValue({
      query: queryMock,
    });
    hasDatabaseConnectionStringMock.mockReturnValue(true);

    const { persistQuickContactLead } =
      await import("@/server/db/contact/persist-quick-contact");

    const result = await persistQuickContactLead({
      emailContact: {
        createdAt: new Date("2026-03-26T09:30:00.000Z"),
        id: "email-contact-id",
        leadSubmissionId: "submission-id",
        message: "Kurze erste Anfrage.",
        updatedAt: new Date("2026-03-26T09:30:00.000Z"),
      },
      lead: {
        createdAt: new Date("2026-03-26T09:30:00.000Z"),
        email: "max@example.com",
        firstName: "Max",
        id: "lead-api-id",
        lastName: "Mustermann",
        leadStatus: "new",
        updatedAt: new Date("2026-03-26T09:30:00.000Z"),
      },
      submission: {
        channel: "quick_contact",
        consentAcceptedAt: new Date("2026-03-26T09:30:00.000Z"),
        createdAt: new Date("2026-03-26T09:30:00.000Z"),
        id: "submission-id",
        locale: "de",
        requestId: "request_123",
        submissionStartedAt: new Date("2026-03-26T09:00:00.000Z"),
        updatedAt: new Date("2026-03-26T09:30:00.000Z"),
      },
    });

    expect(result).toEqual({
      persisted: true,
      submissionId: "submission-id",
    });
    expect(queryMock).toHaveBeenCalledTimes(1);
    const query = queryMock.mock.calls[0]?.[0].replace(/\s+/g, " ").trim();
    expect(query).toContain("WITH upserted_lead AS");
    expect(query).toContain("INSERT INTO lead_email_contacts");
  });
});
