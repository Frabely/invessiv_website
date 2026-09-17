import { beforeEach, describe, expect, it, vi } from "vitest";
import { activities, leads } from "@invessiv/db/record-configuration";
import { leadService } from "@/server/workspace/leads/services/lead/lead-service";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));

describe("leadService", () => {
  beforeEach(() => mocks.getDatabase.mockReset());

  it("removes lead-only history and detaches customer history before deleting leads", async () => {
    const deletedTables: unknown[] = [];
    const updatedTables: unknown[] = [];
    const updateValues: unknown[] = [];
    const tx = {
      delete: vi.fn((table: unknown) => {
        deletedTables.push(table);
        return {
          where: () => ({
            returning: async () => (table === leads ? [{ id: "lead-1" }] : []),
          }),
        };
      }),
      update: vi.fn((table: unknown) => {
        updatedTables.push(table);
        return {
          set: (values: unknown) => {
            updateValues.push(values);
            return { where: async () => undefined };
          },
        };
      }),
    };
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
    });

    await expect(leadService.delete(["lead-1"])).resolves.toEqual(["lead-1"]);
    expect(deletedTables).toEqual([activities, leads]);
    expect(updatedTables).toEqual([activities]);
    expect(updateValues).toEqual([{ lead_id: null }]);
  });

  it("does not open a transaction for an empty id list", async () => {
    await expect(leadService.delete([])).resolves.toEqual([]);
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });
});
