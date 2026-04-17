import { describe, expect, it, vi } from "vitest";

const { randomUUIDMock } = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("node:crypto", () => ({
  randomUUID: randomUUIDMock,
}));

describe("mapProjectRequestApiToDb", () => {
  it("creates linked lead, submission, and project request records", async () => {
    randomUUIDMock
      .mockReturnValueOnce("lead-id-1")
      .mockReturnValueOnce("submission-id-1")
      .mockReturnValueOnce("project-request-id-1");

    const { mapProjectRequestDtoToDbPersistInput } =
      await import("@/server/services/contact/project-request/project-request-mapping-service");

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const result = mapProjectRequestDtoToDbPersistInput(
      {
        budgetKey: "between_2500_5000",
        company: "Invessiv GmbH",
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        goalKey: "generate_inquiries",
        kind: "project_request",
        lastName: "Mustermann",
        locale: "de",
        offerKey: "landing",
        customPageNames: ["Karriereseite"],
        pageKeys: ["home", "contact"],
        phone: "+49 151 23456789",
        preferredStartKey: "within_two_weeks",
        projectDetails: "Eine Landingpage fuer qualifizierte Leads.",
        role: "Founder",
        startedAt: "2026-03-26T09:00:00.000Z",
        website: "https://example.com",
        workflowKey: undefined,
      },
      { requestId: "request_123", createdAt },
    );

    expect(result.lead.id).toBe("lead-id-1");
    expect(result.lead.owner).toBeUndefined();
    expect(result.lead_submission.id).toBe("submission-id-1");
    expect(result.lead_submission.lead_id).toBe(result.lead.id);
    expect(result.lead_project_request.id).toBe("project-request-id-1");
    expect(result.lead_project_request.lead_submission_id).toBe(
      result.lead_submission.id,
    );
    expect(result.lead_project_request.page_keys).toEqual(["home", "contact"]);
    expect(result.lead_project_request.custom_page_names).toEqual([
      "Karriereseite",
    ]);
  });
});
