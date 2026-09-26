import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";
import { CustomersConstraintName } from "@invessiv/db/constraint-names/crm/customers-constraint-names";
import { PostgresErrorCode } from "@invessiv/db/core";
import { customers } from "@invessiv/db/record-configuration";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import { updateCustomer } from "@/server/workspace/crm/command-handler/update-customer.command-handler";
import {
  customerDetailFixture,
  TEST_CATEGORY_ID,
  TEST_CUSTOMER_ID,
  updateCustomerRequestFixture,
} from "@/server/tests/workspace/crm/support/crm-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  updateVersioned: vi.fn(),
  isActiveCategory: vi.fn(),
  findDetail: vi.fn(),
  findStatus: vi.fn(),
  createActivity: vi.fn(),
  synchronizeContacts: vi.fn(),
  isContactWriteConflict: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.updateVersioned,
}));
vi.mock("@/server/workspace/crm/services/customer-category-service", () => ({
  customerCategoryService: { isActive: mocks.isActiveCategory },
}));
vi.mock("@/server/workspace/crm/services/customer-read-service", () => ({
  customerReadService: {
    findDetailById: mocks.findDetail,
    findStatusById: mocks.findStatus,
  },
}));
vi.mock("@/server/shared/services/activity-service", () => ({
  activityService: { createActivity: mocks.createActivity },
}));
vi.mock(
  "@/server/workspace/crm/services/customer-contact/customer-contact-service",
  () => ({
    customerContactService: {
      synchronizeCustomerContacts: mocks.synchronizeContacts,
      isContactWriteConflict: mocks.isContactWriteConflict,
    },
  }),
);

const tx = {};
const REQUEST = updateCustomerRequestFixture({ version: 3 });
const actor = workspaceActorWith();

describe("updateCustomer", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (value: typeof tx) => Promise<unknown>) =>
        callback(tx),
    });
    mocks.isActiveCategory.mockResolvedValue(true);
    mocks.updateVersioned.mockResolvedValue({
      ok: true,
      value: TEST_CUSTOMER_ID,
    });
    mocks.findDetail.mockResolvedValue(customerDetailFixture({ version: 4 }));
    mocks.findStatus.mockResolvedValue("active");
    mocks.synchronizeContacts.mockResolvedValue(undefined);
    mocks.isContactWriteConflict.mockReturnValue(false);
  });

  it("answers not found for a malformed id without touching the database", async () => {
    await expect(updateCustomer("customer-1", REQUEST, actor)).resolves.toEqual(
      {
        ok: false,
        code: CustomerErrorCode.CustomerNotFound,
      },
    );
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("requires the version it read", async () => {
    const withoutVersion: Partial<UpdateCustomerRequestDto> = { ...REQUEST };
    delete withoutVersion.version;

    const result = await updateCustomer(
      TEST_CUSTOMER_ID,
      withoutVersion as UpdateCustomerRequestDto,
      actor,
    );

    expect(result).toMatchObject({
      ok: false,
      code: CustomerErrorCode.ValidationError,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("writes through updateVersioned and returns the fresh detail", async () => {
    const result = await updateCustomer(
      TEST_CUSTOMER_ID,
      {
        ...REQUEST,
        displayName: "Nordlicht Coaching Köln",
      },
      actor,
    );

    expect(result).toEqual({
      ok: true,
      customer: customerDetailFixture({ version: 4 }),
    });
    const [args] = mocks.updateVersioned.mock.calls[0];
    expect(args).toMatchObject({
      tx,
      table: customers,
      id: TEST_CUSTOMER_ID,
      expectedVersion: 3,
      patch: {
        display_name: "Nordlicht Coaching Köln",
        status: "active",
      },
    });
    expect(args.patch).not.toHaveProperty("owner_member_id");
    expect(mocks.createActivity).not.toHaveBeenCalled();
  });

  it("tells a missing customer apart from a version conflict", async () => {
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.NotFound,
    });

    await expect(
      updateCustomer(TEST_CUSTOMER_ID, REQUEST, actor),
    ).resolves.toEqual({
      ok: false,
      code: CustomerErrorCode.CustomerNotFound,
    });
    expect(mocks.findDetail).not.toHaveBeenCalled();
  });

  it("returns the complete current state on a version conflict", async () => {
    const current = customerDetailFixture({ version: 5 });
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 5,
        current: TEST_CUSTOMER_ID,
      },
    });
    mocks.findDetail.mockResolvedValue(current);

    await expect(
      updateCustomer(TEST_CUSTOMER_ID, REQUEST, actor),
    ).resolves.toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 5,
        current,
      },
    });
  });

  it("rejects an inactive category before writing", async () => {
    mocks.isActiveCategory.mockResolvedValue(false);

    const result = await updateCustomer(
      TEST_CUSTOMER_ID,
      {
        ...REQUEST,
        categoryId: TEST_CATEGORY_ID,
      },
      actor,
    );

    expect(result).toMatchObject({
      ok: false,
      code: CustomerErrorCode.ValidationError,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("answers a taken display name", async () => {
    mocks.updateVersioned.mockRejectedValue({
      code: PostgresErrorCode.UniqueViolation,
      constraint: CustomersConstraintName.DisplayNameLowerUnique,
    });

    await expect(
      updateCustomer(TEST_CUSTOMER_ID, REQUEST, actor),
    ).resolves.toEqual({
      ok: false,
      code: CustomerErrorCode.DisplayNameTaken,
    });
  });

  it("synchronizes contacts in the same transaction when contacts are supplied", async () => {
    const contacts = [
      {
        isPrimary: true,
        firstName: "Anna",
        lastName: "Berger",
        email: "anna@nordlicht.example",
        phone: null,
        roleLabel: "Geschäftsführung",
        preferredLocale: "de" as const,
      },
    ];

    await updateCustomer(TEST_CUSTOMER_ID, { ...REQUEST, contacts }, actor);

    expect(mocks.synchronizeContacts).toHaveBeenCalledWith(
      tx,
      TEST_CUSTOMER_ID,
      contacts,
    );
  });

  it("does not touch contacts when none are supplied", async () => {
    await updateCustomer(TEST_CUSTOMER_ID, REQUEST, actor);

    expect(mocks.synchronizeContacts).not.toHaveBeenCalled();
  });

  it("maps a contact write conflict to a version conflict with the fresh detail", async () => {
    const current = customerDetailFixture({ version: 6 });
    mocks.synchronizeContacts.mockRejectedValue(new Error("stale contact"));
    mocks.isContactWriteConflict.mockReturnValue(true);
    mocks.findDetail.mockResolvedValue(current);

    await expect(
      updateCustomer(
        TEST_CUSTOMER_ID,
        {
          ...REQUEST,
          contacts: [
            {
              isPrimary: true,
              firstName: "Anna",
              lastName: "Berger",
              email: null,
              phone: null,
              roleLabel: null,
              preferredLocale: "de" as const,
            },
          ],
        },
        actor,
      ),
    ).resolves.toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 6,
        current,
      },
    });
    expect(mocks.createActivity).not.toHaveBeenCalled();
  });

  it("rethrows an error that is not a recognized contact write conflict", async () => {
    mocks.synchronizeContacts.mockRejectedValue(new Error("connection lost"));
    mocks.isContactWriteConflict.mockReturnValue(false);

    await expect(
      updateCustomer(
        TEST_CUSTOMER_ID,
        {
          ...REQUEST,
          contacts: [
            {
              isPrimary: true,
              firstName: "Anna",
              lastName: "Berger",
              email: null,
              phone: null,
              roleLabel: null,
              preferredLocale: "de" as const,
            },
          ],
        },
        actor,
      ),
    ).rejects.toThrow("connection lost");
  });

  it("records a status change inside the customer update", async () => {
    await updateCustomer(
      TEST_CUSTOMER_ID,
      { ...REQUEST, status: "paused" },
      actor,
    );

    expect(mocks.createActivity).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        customerId: TEST_CUSTOMER_ID,
        type: "status_change",
        metadata: {
          previous_status: "active",
          next_status: "paused",
        },
        actor: { type: "user", userId: actor.userId },
      }),
    );
  });
});
