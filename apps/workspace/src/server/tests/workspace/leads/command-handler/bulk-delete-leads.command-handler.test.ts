import { beforeEach, describe, expect, it, vi } from "vitest";
import { bulkDeleteLeads } from "@/server/workspace/leads/command-handler/bulk-delete-leads.command-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ delete: vi.fn() }));
vi.mock("@/server/workspace/leads/services/lead/lead-service", () => ({
  leadService: { delete: mocks.delete },
}));

describe("bulkDeleteLeads", () => {
  beforeEach(() => mocks.delete.mockReset());

  it("returns ok:true with empty result when ids array is empty", async () => {
    await expect(bulkDeleteLeads({ ids: [] })).resolves.toEqual({
      ok: true,
      deletedCount: 0,
    });
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("deletes the matched rows and reports the deleted count", async () => {
    mocks.delete.mockResolvedValue(["lead-1", "lead-2"]);

    await expect(
      bulkDeleteLeads({ ids: ["lead-1", "lead-2"] }),
    ).resolves.toEqual({ ok: true, deletedCount: 2 });
    expect(mocks.delete).toHaveBeenCalledWith(["lead-1", "lead-2"]);
  });
});
