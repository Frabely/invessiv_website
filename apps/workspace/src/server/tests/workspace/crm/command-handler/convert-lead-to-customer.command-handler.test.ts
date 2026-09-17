import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import {
  activities,
  customerContactAssignments,
  customers,
  leads,
  people,
} from "@invessiv/db/record-configuration";
import { convertLeadToCustomer } from "@/server/workspace/crm/command-handler/convert-lead-to-customer.command-handler";
import {
  createCustomerRequestFixture,
  customerDetailFixture,
  TEST_CUSTOMER_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createActivity: vi.fn(),
  findDetail: vi.fn(),
  getDatabase: vi.fn(),
  insertValues: vi.fn(),
  isActiveCategory: vi.fn(),
  lockActiveMember: vi.fn(),
  updateSet: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock(
  "@/server/workspace/access/services/responsibilities/member-responsibility-lock-service",
  () => ({
    memberResponsibilityLockService: {
      lockActiveMemberForAssignment: mocks.lockActiveMember,
    },
  }),
);
vi.mock("@/server/workspace/crm/services/customer-category-service", () => ({
  customerCategoryService: { isActive: mocks.isActiveCategory },
}));
vi.mock("@/server/workspace/crm/services/customer-read-service", () => ({
  customerReadService: { findDetailById: mocks.findDetail },
}));
vi.mock("@/server/workspace/shared/services/activity-service", () => ({
  activityService: { createActivity: mocks.createActivity },
}));

const actor = workspaceActorWith();
let lockedLead: { customerId: string | null } | undefined;
const tx = {
  select: vi.fn(() => ({
    from: () => ({
      where: () => ({
        limit: () => ({ for: async () => (lockedLead ? [lockedLead] : []) }),
      }),
    }),
  })),
  insert: vi.fn((table: unknown) => ({
    values: (values: unknown) => mocks.insertValues(table, values),
  })),
  update: vi.fn((table: unknown) => ({
    set: (values: unknown) => ({
      where: () => mocks.updateSet(table, values),
    }),
  })),
};

describe("convertLeadToCustomer", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    tx.select.mockClear();
    tx.insert.mockClear();
    tx.update.mockClear();
    lockedLead = { customerId: null };
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (value: typeof tx) => Promise<unknown>) =>
        callback(tx),
    });
    mocks.lockActiveMember.mockResolvedValue(true);
    mocks.isActiveCategory.mockResolvedValue(true);
    mocks.insertValues.mockResolvedValue(undefined);
    mocks.updateSet.mockResolvedValue(undefined);
    mocks.findDetail.mockResolvedValue(
      customerDetailFixture({
        id: TEST_CUSTOMER_ID,
        sourceLeads: [{ id: "lead-1", displayName: "Nordlicht" }],
      }),
    );
  });

  it("creates customer, person and primary contact and links history atomically", async () => {
    const result = await convertLeadToCustomer(
      "lead-1",
      createCustomerRequestFixture(),
      actor,
    );

    expect(result.ok).toBe(true);
    expect(mocks.insertValues.mock.calls.map(([table]) => table)).toEqual([
      people,
      customers,
      customerContactAssignments,
    ]);
    expect(mocks.updateSet.mock.calls.map(([table]) => table)).toEqual([
      leads,
      activities,
    ]);
    expect(mocks.updateSet.mock.calls[0]?.[1]).toMatchObject({
      lead_status: "won",
      customer_id: expect.any(String),
    });
    const customerId = mocks.updateSet.mock.calls[0]?.[1].customer_id;
    expect(mocks.createActivity).toHaveBeenCalledWith(tx, {
      leadId: "lead-1",
      customerId,
      type: ActivityType.ConvertedFromLead,
      actor: { type: ActorType.User, userId: actor.userId },
    });
  });

  it("returns the already linked customer without another write", async () => {
    lockedLead = { customerId: TEST_CUSTOMER_ID };

    const result = await convertLeadToCustomer(
      "lead-1",
      createCustomerRequestFixture(),
      actor,
    );

    expect(result).toEqual({
      ok: true,
      customer: customerDetailFixture({
        id: TEST_CUSTOMER_ID,
        sourceLeads: [{ id: "lead-1", displayName: "Nordlicht" }],
      }),
    });
    expect(mocks.insertValues).not.toHaveBeenCalled();
    expect(mocks.updateSet).not.toHaveBeenCalled();
    expect(mocks.createActivity).not.toHaveBeenCalled();
  });

  it("answers not found before writing", async () => {
    lockedLead = undefined;

    await expect(
      convertLeadToCustomer(
        "missing-lead",
        createCustomerRequestFixture(),
        actor,
      ),
    ).resolves.toEqual({
      ok: false,
      code: LeadConversionErrorCode.LeadNotFound,
    });
    expect(mocks.insertValues).not.toHaveBeenCalled();
  });

  it("does not write history when the primary contact insert fails", async () => {
    mocks.insertValues.mockImplementation(async (table: unknown) => {
      if (table === customerContactAssignments)
        throw new Error("contact failed");
    });

    await expect(
      convertLeadToCustomer("lead-1", createCustomerRequestFixture(), actor),
    ).rejects.toThrow("contact failed");
    expect(mocks.updateSet).not.toHaveBeenCalled();
    expect(mocks.createActivity).not.toHaveBeenCalled();
  });
});
