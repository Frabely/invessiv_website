import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadActivityType } from "@invessiv/common/constants/leads/activity/lead-activity-types";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import { markLeadContacted } from "@/server/workspace/leads/command-handler/mark-lead-contacted.command-handler";

const { getDrizzleDatabaseClientMock, createLeadActivityMock, selectRows } =
  vi.hoisted(() => ({
    getDrizzleDatabaseClientMock: vi.fn(),
    createLeadActivityMock: vi.fn().mockResolvedValue(undefined),
    selectRows: { current: [] as Array<{ id: string; lead_status: string }> },
  }));

vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));
vi.mock("@invessiv/db/record-configuration", () => ({
  leads: { id: "leads.id", lead_status: "leads.lead_status" },
}));
vi.mock("@/server/workspace/leads/services/lead-activity-service", () => ({
  leadActivityService: { createLeadActivity: createLeadActivityMock },
}));
vi.mock("drizzle-orm", () => ({ eq: vi.fn(() => "eq") }));

const updateSet = vi.fn();

function makeTransaction() {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => selectRows.current,
        }),
      }),
    }),
    update: () => ({
      set: (values: unknown) => {
        updateSet(values);
        return { where: async () => undefined };
      },
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  selectRows.current = [];
  getDrizzleDatabaseClientMock.mockReturnValue({
    transaction: async (callback: (tx: unknown) => unknown) =>
      callback(makeTransaction()),
  });
});

describe("markLeadContacted", () => {
  it("sets the status to contacted and records the change", async () => {
    selectRows.current = [{ id: "lead-1", lead_status: ContactLeadStatus.New }];

    const result = await markLeadContacted("lead-1");

    expect(result).toEqual({
      ok: true,
      leadStatus: ContactLeadStatus.Contacted,
      changed: true,
    });
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ lead_status: ContactLeadStatus.Contacted }),
    );
    expect(createLeadActivityMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        leadId: "lead-1",
        type: LeadActivityType.StatusChange,
        metadata: {
          previous_status: ContactLeadStatus.New,
          next_status: ContactLeadStatus.Contacted,
        },
      }),
    );
  });

  it("stays idempotent for a lead that is already contacted", async () => {
    selectRows.current = [
      { id: "lead-1", lead_status: ContactLeadStatus.Contacted },
    ];

    const result = await markLeadContacted("lead-1");

    expect(result).toEqual({
      ok: true,
      leadStatus: ContactLeadStatus.Contacted,
      changed: false,
    });
    expect(updateSet).not.toHaveBeenCalled();
    expect(createLeadActivityMock).not.toHaveBeenCalled();
  });

  it("reports NOT_FOUND for an unknown lead", async () => {
    selectRows.current = [];

    const result = await markLeadContacted("missing");

    expect(result).toEqual({ ok: false, code: LeadErrorCode.NotFound });
    expect(updateSet).not.toHaveBeenCalled();
  });
});
