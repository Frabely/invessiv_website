import { describe, expect, it, vi } from "vitest";

import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { StatusChangeOrigin } from "@invessiv/common/constants/activity/status-change-origins";

const { getDrizzleDatabaseClientMock, createLeadActivityMock } = vi.hoisted(
  () => ({
    getDrizzleDatabaseClientMock: vi.fn(),
    createLeadActivityMock: vi.fn().mockResolvedValue(undefined),
  }),
);

vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));
vi.mock("@/server/workspace/shared/services/activity-service", () => ({
  activityService: {
    createActivity: createLeadActivityMock,
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

const ACTOR_USER_ID = "user-actor-uuid";

describe("bulkArchiveLeads", () => {
  it("returns ok:true with empty result when ids array is empty", async () => {
    vi.resetModules();
    const { bulkArchiveLeads } =
      await import("@/server/workspace/leads/command-handler/bulk-archive-leads.command-handler");

    const result = await bulkArchiveLeads({ ids: [] }, ACTOR_USER_ID);

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

    const result = await bulkArchiveLeads(
      { ids: ["lead-1", "lead-2"] },
      ACTOR_USER_ID,
    );

    expect(result).toEqual({ ok: true, updatedCount: 1 });
    expect(updateCaptures).toHaveLength(1);
    expect(updateCaptures[0].lead_status).toBe(ContactLeadStatus.Archived);
    expect(createLeadActivityMock).toHaveBeenCalledTimes(1);
    expect(createLeadActivityMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        actor: { type: ActorType.User, userId: ACTOR_USER_ID },
        leadId: "lead-1",
        type: ActivityType.StatusChange,
        metadata: {
          previous_status: "new",
          next_status: ContactLeadStatus.Archived,
          origin: StatusChangeOrigin.BulkArchive,
        },
      }),
    );
  });
});
