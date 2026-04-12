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
        createdAt: new Date("2026-03-26T09:30:00.000Z"),
        email: "max@example.com",
        firstName: "Max",
        id: "lead-api-id",
        lastName: "Mustermann",
        leadStatus: "new",
        updatedAt: new Date("2026-03-26T09:30:00.000Z"),
      },
      projectRequest: {
        budgetKey: "between_2500_5000",
        company: "Invessiv GmbH",
        createdAt: new Date("2026-03-26T09:30:00.000Z"),
        customPageNames: ["Karriereseite"],
        goalKey: "generate_inquiries",
        id: "project-request-id",
        leadSubmissionId: "submission-id",
        offerKey: "landing",
        pageKeys: ["home", "contact"],
        phone: "+49 151 23456789",
        preferredStartKey: "within_two_weeks",
        projectDetails: "Eine Landingpage fuer qualifizierte Leads.",
        role: "Founder",
        updatedAt: new Date("2026-03-26T09:30:00.000Z"),
        website: "https://example.com",
        workflowKey: undefined,
      },
      submission: {
        channel: "project_request",
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
    expect(query).toContain("inserted_submission AS");
    expect(query).toContain("INSERT INTO lead_project_requests");
  });
});
