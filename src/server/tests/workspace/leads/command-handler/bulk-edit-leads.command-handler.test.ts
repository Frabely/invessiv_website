import { describe, expect, it, vi } from "vitest";

import { BulkSkipReason } from "@/common/constants/leads/bulk/bulk-skip-reasons";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";

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

type LeadState = {
  id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  lead_status: string;
  category_id: string | null;
  score: number | null;
  owner: string | null;
  notes: string | null;
  improvements: string[] | null;
};

type SetClause = Record<string, unknown>;

function buildLead(overrides: Partial<LeadState>): LeadState {
  return {
    id: "lead-1",
    display_name: "Lead Eins",
    first_name: null,
    last_name: null,
    company_name: null,
    email: null,
    lead_status: "new",
    category_id: null,
    score: null,
    owner: null,
    notes: null,
    improvements: null,
    ...overrides,
  };
}

function setupDb(rows: LeadState[]) {
  const updateCaptures: SetClause[] = [];
  let rowIndex = 0;

  function selectChain() {
    return {
      from: () => ({
        where: () => ({
          limit: async () => {
            const next = rows[rowIndex] ?? null;
            rowIndex += 1;
            return next ? [next] : [];
          },
        }),
      }),
    };
  }

  function updateChain() {
    return {
      set: (setArgs: SetClause) => ({
        where: async () => {
          updateCaptures.push(setArgs);
        },
      }),
    };
  }

  const dbMock = {
    select: selectChain,
    transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
      return cb({
        update: updateChain,
      });
    },
  };

  getDrizzleDatabaseClientMock.mockReturnValue(dbMock);

  return { updateCaptures };
}

describe("bulkEditLeads", () => {
  it("returns ok:true with empty result when ids array is empty", async () => {
    vi.resetModules();
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    const result = await bulkEditLeads({ ids: [], patch: {} });

    expect(result).toEqual({ ok: true, updatedCount: 0, failedLeads: [] });
  });

  it("updates a lead's status when the status differs", async () => {
    vi.resetModules();
    createLeadActivityMock.mockClear();
    const { updateCaptures } = setupDb([buildLead({ lead_status: "new" })]);
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    const result = await bulkEditLeads({
      ids: ["lead-1"],
      patch: { status: "qualified" },
    });

    expect(result).toEqual({
      ok: true,
      updatedCount: 1,
      failedLeads: [],
    });
    expect(updateCaptures).toHaveLength(1);
    expect(updateCaptures[0].lead_status).toBe("qualified");
    expect(createLeadActivityMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ type: LeadActivityType.BulkEdit }),
    );
  });

  it("skips a lead whose appended note exceeds the 5000-char limit", async () => {
    vi.resetModules();
    const existingNotes = "x".repeat(4980);
    const { updateCaptures } = setupDb([
      buildLead({ notes: existingNotes, display_name: "Bob" }),
    ]);
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    const result = await bulkEditLeads({
      ids: ["lead-1"],
      patch: { notes_append: "y".repeat(100) },
    });

    expect(updateCaptures).toHaveLength(0);
    expect(result.updatedCount).toBe(0);
    expect(result.failedLeads).toEqual([
      {
        id: "lead-1",
        displayName: "Bob",
        reason: BulkSkipReason.NotesTooLong,
      },
    ]);
  });

  it("appends a note with newline separator only when existing note is non-empty", async () => {
    vi.resetModules();
    const { updateCaptures } = setupDb([
      buildLead({ id: "lead-1", notes: "alt" }),
      buildLead({ id: "lead-2", notes: null }),
    ]);
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    await bulkEditLeads({
      ids: ["lead-1", "lead-2"],
      patch: { notes_append: "neu" },
    });

    expect(updateCaptures[0].notes).toBe("alt\nneu");
    expect(updateCaptures[1].notes).toBe("neu");
  });

  it("appends improvements to the existing list", async () => {
    vi.resetModules();
    const { updateCaptures } = setupDb([buildLead({ improvements: ["a"] })]);
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    await bulkEditLeads({
      ids: ["lead-1"],
      patch: { improvements_append: ["b", "c"] },
    });

    expect(updateCaptures[0].improvements).toEqual(["a", "b", "c"]);
  });

  it("clears owner to null when patch.owner is null", async () => {
    vi.resetModules();
    const { updateCaptures } = setupDb([buildLead({ owner: "Lisa" })]);
    const { bulkEditLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler");

    await bulkEditLeads({
      ids: ["lead-1"],
      patch: { owner: null },
    });

    expect(updateCaptures[0].owner).toBeNull();
  });
});
