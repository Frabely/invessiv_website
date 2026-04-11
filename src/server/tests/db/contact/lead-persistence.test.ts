import { describe, expect, it, vi } from "vitest";
import type { PreparedLeadRecord } from "@/server/common/contracts/contact/prepared-lead-record";

vi.mock("server-only", () => ({}));

describe("persistLead", () => {
  it("inserts the lead upsert with the provided values", async () => {
    const tx = vi.fn().mockResolvedValue([{ id: "lead-db-id" }]);

    const { persistLead } = await import(
      "@/server/db/contact/lead-persistence"
    );

    const lead: PreparedLeadRecord = {
      createdAt: new Date("2026-03-26T09:30:00.000Z"),
      email: "max@example.com",
      firstName: "Max",
      id: "lead-api-id",
      lastName: "Mustermann",
      leadStatus: "new",
      updatedAt: new Date("2026-03-26T09:30:00.000Z"),
    };

    const result = await persistLead(tx as never, lead);

    expect(result).toEqual({
      leadId: "lead-db-id",
      persisted: true,
    });
    expect(tx).toHaveBeenCalledTimes(1);

    const [strings, ...values] = tx.mock.calls[0];
    expect(strings.join("")).toContain("INSERT INTO leads");
    expect(values).toEqual([
      "lead-api-id",
      "Max",
      "Mustermann",
      "max@example.com",
      "new",
      new Date("2026-03-26T09:30:00.000Z"),
      new Date("2026-03-26T09:30:00.000Z"),
    ]);
  });
});
