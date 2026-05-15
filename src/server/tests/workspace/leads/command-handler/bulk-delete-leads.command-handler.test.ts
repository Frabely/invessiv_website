import { describe, expect, it, vi } from "vitest";

const { getDrizzleDatabaseClientMock } = vi.hoisted(() => ({
  getDrizzleDatabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/db/core")>()),
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));

function setupDb(deletedRows: Array<{ id: string }>) {
  const whereCaptures: unknown[] = [];

  const dbMock = {
    delete: () => ({
      where: (clause: unknown) => {
        whereCaptures.push(clause);
        return {
          returning: async () => deletedRows,
        };
      },
    }),
  };

  getDrizzleDatabaseClientMock.mockReturnValue(dbMock);

  return { whereCaptures };
}

describe("bulkDeleteLeads", () => {
  it("returns ok:true with empty result when ids array is empty", async () => {
    vi.resetModules();
    const { bulkDeleteLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-delete-leads.command-handler");

    const result = await bulkDeleteLeads({ ids: [] });

    expect(result).toEqual({ ok: true, deletedCount: 0 });
  });

  it("deletes the matched rows and reports the deleted count", async () => {
    vi.resetModules();
    const { whereCaptures } = setupDb([{ id: "lead-1" }, { id: "lead-2" }]);
    const { bulkDeleteLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-delete-leads.command-handler");

    const result = await bulkDeleteLeads({ ids: ["lead-1", "lead-2"] });

    expect(result).toEqual({ ok: true, deletedCount: 2 });
    expect(whereCaptures).toHaveLength(1);
  });
});
