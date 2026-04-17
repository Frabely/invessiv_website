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

describe("persistProjectRequestLead", () => {
  it("executes one query with shared lead and submission CTEs", async () => {
    const queryMock = vi.fn().mockResolvedValue([]);
    getDatabaseClientMock.mockReturnValue({
      query: queryMock,
    });
    hasDatabaseConnectionStringMock.mockReturnValue(true);

    const { persistProjectRequestLead } =
      await import("@/server/db/contact/persist-project-request");

    const result = await persistProjectRequestLead({
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
      lead_project_request: {
        budget_key: "between_2500_5000",
        company: "Invessiv GmbH",
        created_at: new Date("2026-03-26T09:30:00.000Z"),
        custom_page_names: ["Karriereseite"],
        goal_key: "generate_inquiries",
        id: "project-request-id",
        lead_submission_id: "submission-id",
        offer_key: "landing",
        page_keys: ["home", "contact"],
        phone: "+49 151 23456789",
        preferred_start_key: "within_two_weeks",
        project_details: "Eine Landingpage fuer qualifizierte Leads.",
        role: "Founder",
        updated_at: new Date("2026-03-26T09:30:00.000Z"),
        website: "https://example.com",
        workflow_key: undefined,
      },
      lead_submission: {
        channel: "project_request",
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
    expect(query).toContain("inserted_submission AS");
    expect(query).toContain("INSERT INTO lead_project_requests");
  });
});
