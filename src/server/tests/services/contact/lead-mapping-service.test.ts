import { describe, expect, it, vi } from "vitest";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadSource } from "@/common/constants/leads/lead-sources";

const { randomUUIDMock } = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("node:crypto", () => ({
  randomUUID: randomUUIDMock,
}));

describe("mapLeadApiToDb", () => {
  it("trims name fields and assigns the default lead status", async () => {
    randomUUIDMock.mockReturnValueOnce("lead-id-1");

    const { mapLeadApiToDb } =
      await import("@/server/services/contact/lead-mapping-service");

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const result = mapLeadApiToDb(
      {
        email: " max@example.com ",
        firstName: " Max ",
        lastName: " Mustermann ",
      },
      createdAt,
      { defaultLeadStatus: ContactLeadStatus.New },
    );

    expect(result).toEqual({
      created_at: createdAt,
      email: "max@example.com",
      first_name: "Max",
      id: "lead-id-1",
      last_name: "Mustermann",
      lead_status: ContactLeadStatus.New,
      owner: undefined,
      source: LeadSource.Webform,
      updated_at: createdAt,
    });
  });
});
