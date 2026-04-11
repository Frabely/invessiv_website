import { describe, expect, it, vi } from "vitest";
import { CONTACT_LEAD_STORAGE } from "@/server/config/contact-lead-storage";

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

    const { mapLeadApiToDb } = await import(
      "@/server/services/contact/lead-mapping-service"
    );

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const result = mapLeadApiToDb(
      {
        email: " max@example.com ",
        firstName: " Max ",
        lastName: " Mustermann ",
      },
      createdAt,
      { defaultLeadStatus: CONTACT_LEAD_STORAGE.defaultLeadStatus },
    );

    expect(result).toEqual({
      createdAt,
      email: "max@example.com",
      firstName: "Max",
      id: "lead-id-1",
      lastName: "Mustermann",
      leadStatus: CONTACT_LEAD_STORAGE.defaultLeadStatus,
      updatedAt: createdAt,
    });
  });
});
