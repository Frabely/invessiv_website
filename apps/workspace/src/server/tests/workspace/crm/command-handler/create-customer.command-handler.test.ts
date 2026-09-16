import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { CustomersConstraintName } from "@invessiv/db/constraint-names/crm/customers-constraint-names";
import { PostgresErrorCode } from "@invessiv/db/core";
import {
  customerContactAssignments,
  customers,
  people,
} from "@invessiv/db/record-configuration";
import { createCustomer } from "@/server/workspace/crm/command-handler/create-customer.command-handler";
import {
  TEST_ACTOR_USER_ID,
  workspaceActorWith,
} from "@/server/tests/support/workspace-auth-fixtures";
import {
  createCustomerRequestFixture,
  customerDetailFixture,
  TEST_CATEGORY_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  lockActiveMember: vi.fn(),
  isActiveCategory: vi.fn(),
  findDetail: vi.fn(),
  createActivity: vi.fn(),
  insertValues: vi.fn(),
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
const tx = {
  insert: vi.fn((table: unknown) => ({
    values: (values: unknown) => mocks.insertValues(table, values),
  })),
};

function insertedInto(table: unknown) {
  return mocks.insertValues.mock.calls.find(
    ([target]) => target === table,
  )?.[1];
}

describe("createCustomer", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    tx.insert.mockClear();
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (value: typeof tx) => Promise<unknown>) =>
        callback(tx),
    });
    mocks.lockActiveMember.mockResolvedValue(true);
    mocks.isActiveCategory.mockResolvedValue(true);
    mocks.insertValues.mockResolvedValue(undefined);
    mocks.findDetail.mockResolvedValue(customerDetailFixture());
  });

  it("creates customer, person and primary assignment with minimal data", async () => {
    const result = await createCustomer(
      {
        ...createCustomerRequestFixture(),
        companyName: null,
        city: null,
        primaryContact: {
          firstName: null,
          lastName: "Berger",
          email: null,
          phone: null,
          roleLabel: null,
          preferredLocale: "de",
        },
      },
      actor,
    );

    expect(result).toEqual({ ok: true, customer: customerDetailFixture() });
    expect(mocks.insertValues.mock.calls.map(([table]) => table)).toEqual([
      people,
      customers,
      customerContactAssignments,
    ]);

    const person = insertedInto(people);
    const customer = insertedInto(customers);
    const assignment = insertedInto(customerContactAssignments);
    expect(customer).toMatchObject({
      status: "active",
      owner_member_id: actor.workspaceMemberId,
      version: 1,
    });
    expect(person).toMatchObject({ display_name: "Berger", version: 1 });
    expect(assignment).toMatchObject({
      customer_id: customer.id,
      person_id: person.id,
      is_primary: true,
    });
    expect(mocks.lockActiveMember).toHaveBeenCalledWith(
      tx,
      actor.workspaceMemberId,
    );
  });

  it("writes exactly one created activity attributed to the actor", async () => {
    await createCustomer(createCustomerRequestFixture(), actor);

    expect(mocks.createActivity).toHaveBeenCalledTimes(1);
    expect(mocks.createActivity).toHaveBeenCalledWith(tx, {
      customerId: insertedInto(customers).id,
      type: ActivityType.Created,
      actor: { type: ActorType.User, userId: TEST_ACTOR_USER_ID },
    });
  });

  it("returns the validation issues without opening a transaction", async () => {
    const result = await createCustomer(
      { ...createCustomerRequestFixture(), displayName: " " },
      actor,
    );

    expect(result).toMatchObject({
      ok: false,
      code: CustomerErrorCode.ValidationError,
      errors: [expect.objectContaining({ path: ["displayName"] })],
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("rejects a parallel deactivated owner without writing", async () => {
    mocks.lockActiveMember.mockResolvedValue(false);

    const result = await createCustomer(createCustomerRequestFixture(), actor);

    expect(result).toEqual({
      ok: false,
      code: CustomerErrorCode.OwnerInactive,
    });
    expect(mocks.insertValues).not.toHaveBeenCalled();
    expect(mocks.createActivity).not.toHaveBeenCalled();
  });

  it("rejects an unknown or inactive category without writing", async () => {
    mocks.isActiveCategory.mockResolvedValue(false);

    const result = await createCustomer(
      createCustomerRequestFixture({ categoryId: TEST_CATEGORY_ID }),
      actor,
    );

    expect(result).toMatchObject({
      ok: false,
      code: CustomerErrorCode.ValidationError,
      errors: [expect.objectContaining({ path: ["categoryId"] })],
    });
    expect(mocks.insertValues).not.toHaveBeenCalled();
  });

  it("answers a taken display name instead of creating a second customer", async () => {
    mocks.insertValues.mockImplementation(async (table: unknown) => {
      if (table === customers) {
        throw new Error("duplicate", {
          cause: {
            code: PostgresErrorCode.UniqueViolation,
            constraint: CustomersConstraintName.DisplayNameLowerUnique,
          },
        });
      }
    });

    const result = await createCustomer(createCustomerRequestFixture(), actor);

    expect(result).toEqual({
      ok: false,
      code: CustomerErrorCode.DisplayNameTaken,
    });
    expect(mocks.createActivity).not.toHaveBeenCalled();
  });

  it("aborts the transaction when the contact insert fails", async () => {
    mocks.insertValues.mockImplementation(async (table: unknown) => {
      if (table === customerContactAssignments) {
        throw new Error("connection lost");
      }
    });

    await expect(
      createCustomer(createCustomerRequestFixture(), actor),
    ).rejects.toThrow("connection lost");
    expect(mocks.createActivity).not.toHaveBeenCalled();
    expect(mocks.findDetail).not.toHaveBeenCalled();
  });
});
