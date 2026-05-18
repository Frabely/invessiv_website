import { describe, expect, it, vi } from "vitest";

import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";

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
  leadActivityService: {
    createLeadActivity: createLeadActivityMock,
  },
}));

type LeadState = {
  id: string;
  lead_status: string;
};

type SetClause = Record<string, unknown>;

function buildLead(overrides: Partial<LeadState>): LeadState {
  return {
    id: "lead-1",
    lead_status: "new",
    ...overrides,
  };
}

function setupDb(rows: LeadState[]) {
  const updateCaptures: SetClause[] = [];

  const dbMock = {
    transaction: async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        select: () => ({
          from: () => ({
            where: async () => rows.map((row) => row),
          }),
        }),
        update: () => ({
          set: (setArgs: SetClause) => ({
            where: async () => {
              updateCaptures.push(setArgs);
            },
          }),
        }),
      }),
  };

  getDrizzleDatabaseClientMock.mockReturnValue(dbMock);

  return { updateCaptures };
}

describe("bulkArchiveLeads", () => {
  it("returns ok:true with empty result when ids array is empty", async () => {
    vi.resetModules();
    const { bulkArchiveLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-archive-leads.command-handler");

    const result = await bulkArchiveLeads({ ids: [] });

    expect(result).toEqual({ ok: true, updatedCount: 0 });
  });

  it("archives only non-archived leads and creates status-change activities", async () => {
    vi.resetModules();
    createLeadActivityMock.mockClear();
    const { updateCaptures } = setupDb([
      buildLead({ id: "lead-1", lead_status: "new" }),
      buildLead({ id: "lead-2", lead_status: ContactLeadStatus.Archived }),
    ]);
    const { bulkArchiveLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-archive-leads.command-handler");

    const result = await bulkArchiveLeads({ ids: ["lead-1", "lead-2"] });

    expect(result).toEqual({ ok: true, updatedCount: 1 });
    expect(updateCaptures).toHaveLength(1);
    expect(updateCaptures[0].lead_status).toBe(ContactLeadStatus.Archived);
    expect(createLeadActivityMock).toHaveBeenCalledTimes(1);
    expect(createLeadActivityMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        actorType: LeadActorType.System,
        leadId: "lead-1",
        type: LeadActivityType.StatusChange,
      }),
    );
  });
});
