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

describe("persistDiscoveryCallLead", () => {
  it("executes one query with shared lead and submission CTEs", async () => {
    const queryMock = vi.fn().mockResolvedValue([]);
    getDatabaseClientMock.mockReturnValue({
      query: queryMock,
    });
    hasDatabaseConnectionStringMock.mockReturnValue(true);

    const { persistDiscoveryCallLead } =
      await import("@/server/db/contact/persist-discovery-call");

    const result = await persistDiscoveryCallLead({
      call_contact: {
        created_at: new Date("2026-03-26T09:30:00.000Z"),
        id: "call-contact-id",
        lead_submission_id: "submission-id",
        message: "Wir wollen den Umfang kurz einordnen.",
        updated_at: new Date("2026-03-26T09:30:00.000Z"),
      },
      lead: {
        created_at: new Date("2026-03-26T09:30:00.000Z"),
        email: "max@example.com",
        first_name: "Max",
        id: "lead-api-id",
        last_name: "Mustermann",
        lead_status: "new",
        owner: undefined,
        updated_at: new Date("2026-03-26T09:30:00.000Z"),
      },
      lead_submission: {
        channel: "discovery_call",
        consent_accepted_at: new Date("2026-03-26T09:30:00.000Z"),
        created_at: new Date("2026-03-26T09:30:00.000Z"),
        id: "submission-id",
        lead_id: "lead-api-id",
        locale: "de",
        request_id: "request_123",
        submission_started_at: new Date("2026-03-26T09:00:00.000Z"),
        updated_at: new Date("2026-03-26T09:30:00.000Z"),
      },
    });

    expect(result).toEqual({
      persisted: true,
      submissionId: "submission-id",
    });
    expect(queryMock).toHaveBeenCalledTimes(1);
    const query = queryMock.mock.calls[0]?.[0].replace(/\s+/g, " ").trim();
    expect(query).toContain("WITH upserted_lead AS");
    expect(query).toContain("INSERT INTO lead_call_contacts");
  });
});
