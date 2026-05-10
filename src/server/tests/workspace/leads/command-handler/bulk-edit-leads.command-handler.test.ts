import { describe, expect, it, vi } from "vitest";

const { getDrizzleDatabaseClientMock, createLeadActivityMock } = vi.hoisted(
  () => ({
    getDrizzleDatabaseClientMock: vi.fn(),
    createLeadActivityMock: vi.fn().mockResolvedValue(undefined),
  }),
);

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/db/core")>()),
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));
vi.mock("@/server/workspace/leads/services/lead-activity-service", () => ({
  createLeadActivity: createLeadActivityMock,
}));

type SelectRow = { id: string; lead_status: string };

function setupDb(existingRows: SelectRow[]) {
  const updateCaptures: Record<string, unknown>[] = [];
  const activityInsertCaptures: unknown[] = [];

  const txMock = {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockResolvedValue(existingRows),
      })),
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((setArgs: Record<string, unknown>) => ({
        where: vi.fn().mockImplementation(() => {
          updateCaptures.push(setArgs);
          return Promise.resolve();
        }),
      })),
    })),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((v: unknown) => {
        activityInsertCaptures.push(v);
        return Promise.resolve();
      }),
    })),
  };

  getDrizzleDatabaseClientMock.mockReturnValue({
    transaction: vi
      .fn()
      .mockImplementation(async (cb: (tx: typeof txMock) => Promise<void>) => {
        await cb(txMock);
      }),
  });

  return { updateCaptures, activityInsertCaptures };
}

describe("bulkEditLeads", () => {
  it("returns ok:true with updatedCount equal to number of actually changed leads", async () => {
    setupDb([
      { id: "id-1", lead_status: "new" },
      { id: "id-2", lead_status: "new" },
    ]);
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    const result = await bulkEditLeads({
      ids: ["id-1", "id-2"],
      status: "qualified",
    });

    expect(result).toEqual({ ok: true, updatedCount: 2 });
  });

  it("skips leads that already have the target status and returns correct updatedCount", async () => {
    vi.resetModules();
    createLeadActivityMock.mockClear();
    createLeadActivityMock.mockResolvedValue(undefined);
    setupDb([
      { id: "id-1", lead_status: "new" },
      { id: "id-2", lead_status: "qualified" },
    ]);
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    const result = await bulkEditLeads({
      ids: ["id-1", "id-2"],
      status: "qualified",
    });

    expect(result).toEqual({ ok: true, updatedCount: 1 });
    expect(createLeadActivityMock).toHaveBeenCalledOnce();
    expect(createLeadActivityMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        body: "new → qualified",
        metadata: {
          previous_status: "new",
          next_status: "qualified",
        },
      }),
    );
  });

  it("sets lead_status and updated_at in the batch UPDATE", async () => {
    vi.resetModules();
    const { updateCaptures } = setupDb([{ id: "id-1", lead_status: "new" }]);
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    await bulkEditLeads({ ids: ["id-1"], status: "qualified" });

    expect(updateCaptures).toHaveLength(1);
    expect(updateCaptures[0].lead_status).toBe("qualified");
    expect(updateCaptures[0].updated_at).toBeInstanceOf(Date);
  });

  it("logs a status_change activity per lead with body '<old> → <new>' and transition metadata", async () => {
    vi.resetModules();
    createLeadActivityMock.mockClear();
    createLeadActivityMock.mockResolvedValue(undefined);
    setupDb([
      { id: "id-1", lead_status: "new" },
      { id: "id-2", lead_status: "contacted" },
    ]);
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    await bulkEditLeads({ ids: ["id-1", "id-2"], status: "qualified" });

    expect(createLeadActivityMock).toHaveBeenCalledTimes(2);
    expect(createLeadActivityMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: "status_change",
        body: "new → qualified",
        metadata: {
          previous_status: "new",
          next_status: "qualified",
        },
      }),
    );
    expect(createLeadActivityMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: "status_change",
        body: "contacted → qualified",
        metadata: {
          previous_status: "contacted",
          next_status: "qualified",
        },
      }),
    );
  });

  it("sets status to archived when called with status='archived' (covers archive use case)", async () => {
    vi.resetModules();
    createLeadActivityMock.mockClear();
    createLeadActivityMock.mockResolvedValue(undefined);
    setupDb([{ id: "id-1", lead_status: "new" }]);
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    const result = await bulkEditLeads({ ids: ["id-1"], status: "archived" });

    expect(result).toEqual({ ok: true, updatedCount: 1 });
    expect(createLeadActivityMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        body: "new → archived",
        metadata: {
          previous_status: "new",
          next_status: "archived",
        },
      }),
    );
  });

  it("returns ok:true with updatedCount 0 when ids array is empty", async () => {
    vi.resetModules();
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    const result = await bulkEditLeads({ ids: [], status: "qualified" });

    expect(result).toEqual({ ok: true, updatedCount: 0 });
  });
});
