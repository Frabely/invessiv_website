import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONTACT_LEAD_STATUS } from "@/common/constants/contact/default-contact-lead-status";

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
      { defaultLeadStatus: DEFAULT_CONTACT_LEAD_STATUS },
    );

    expect(result).toEqual({
      created_at: createdAt,
      email: "max@example.com",
      first_name: "Max",
      id: "lead-id-1",
      last_name: "Mustermann",
      lead_status: DEFAULT_CONTACT_LEAD_STATUS,
      owner: undefined,
      updated_at: createdAt,
    });
  });
});
