import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CustomerContactAssignmentDto } from "@invessiv/common/contracts/crm/customer-contact.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customerContactAssignments,
  people,
} from "@invessiv/db/record-configuration";
import { customerContactService } from "@/server/workspace/crm/services/customer-contact/customer-contact-service";
import {
  customerDetailFixture,
  TEST_CUSTOMER_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findDetail: vi.fn(),
  updateVersioned: vi.fn(),
}));

vi.mock("@/server/workspace/crm/services/customer-read-service", () => ({
  customerReadService: { findDetailById: mocks.findDetail },
}));
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.updateVersioned,
}));

const tx = {} as ContactDatabaseTransaction;

/** A tx double for tests that reach the insert/delete paths, not just updateVersioned. */
function createContactTx(deleteRows: { id: string }[] = [{ id: "deleted" }]) {
  const insertedValues: Array<{
    table: unknown;
    values: Record<string, unknown>;
  }> = [];
  const insert = vi.fn((table: unknown) => ({
    values: (values: Record<string, unknown>) => {
      insertedValues.push({ table, values });
      return Promise.resolve();
    },
  }));
  const del = vi.fn(() => ({
    where: () => ({
      returning: () => Promise.resolve(deleteRows),
    }),
  }));
  return {
    tx: { insert, delete: del } as unknown as ContactDatabaseTransaction,
    insertedValues,
    delete: del,
  };
}

function contactFixture(
  overrides: Partial<CustomerContactAssignmentDto> = {},
): CustomerContactAssignmentDto {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    personId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    displayName: "Anna Berger",
    firstName: "Anna",
    lastName: "Berger",
    primaryEmail: "anna@nordlicht.example",
    primaryPhone: null,
    businessEmail: null,
    businessPhone: null,
    roleLabel: "Managing director",
    isPrimary: true,
    preferredLocale: "de",
    assignmentVersion: 4,
    personVersion: 8,
    createdAt: "2026-09-14T10:00:00.000Z",
    updatedAt: "2026-09-14T10:00:00.000Z",
    ...overrides,
  };
}

function toWriteContact(contact: CustomerContactAssignmentDto) {
  return {
    id: contact.id,
    personId: contact.personId,
    assignmentVersion: contact.assignmentVersion,
    personVersion: contact.personVersion,
    firstName: contact.firstName,
    lastName: contact.lastName ?? "Unknown",
    email: contact.primaryEmail ?? "unknown@example.test",
    phone: contact.primaryPhone,
    roleLabel: contact.roleLabel,
    preferredLocale: contact.preferredLocale,
    isPrimary: contact.isPrimary,
  };
}

describe("customerContactService", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.updateVersioned.mockResolvedValue({ ok: true, value: "updated" });
  });

  it("switches the primary assignment without rewriting unchanged people", async () => {
    const primary = contactFixture();
    const secondary = contactFixture({
      id: "22222222-2222-4222-8222-222222222222",
      personId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      displayName: "Mara Kluge",
      firstName: "Mara",
      lastName: "Kluge",
      isPrimary: false,
    });
    mocks.findDetail.mockResolvedValue(
      customerDetailFixture({ contacts: [primary, secondary] }),
    );

    await customerContactService.synchronizeCustomerContacts(
      tx,
      TEST_CUSTOMER_ID,
      [
        { ...toWriteContact(primary), isPrimary: false },
        { ...toWriteContact(secondary), isPrimary: true },
      ],
    );

    expect(mocks.updateVersioned).toHaveBeenCalledTimes(3);
    expect(mocks.updateVersioned.mock.calls).toEqual(
      expect.arrayContaining([
        [
          expect.objectContaining({
            table: customerContactAssignments,
            id: primary.id,
            expectedVersion: primary.assignmentVersion,
            patch: { is_primary: false },
          }),
        ],
        [
          expect.objectContaining({
            table: customerContactAssignments,
            id: primary.id,
            expectedVersion: primary.assignmentVersion + 1,
            patch: { is_primary: false, role_label: primary.roleLabel },
          }),
        ],
        [
          expect.objectContaining({
            table: customerContactAssignments,
            id: secondary.id,
            expectedVersion: secondary.assignmentVersion,
            patch: { is_primary: true, role_label: secondary.roleLabel },
          }),
        ],
      ]),
    );
  });

  it("classifies a failed contact write as a concurrency conflict", async () => {
    const primary = contactFixture();
    mocks.findDetail.mockResolvedValue(
      customerDetailFixture({ contacts: [primary] }),
    );
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: "VERSION_CONFLICT",
    });

    const error = await customerContactService
      .synchronizeCustomerContacts(tx, TEST_CUSTOMER_ID, [
        { ...toWriteContact(primary), roleLabel: "Managing partner" },
      ])
      .catch((caught: unknown) => caught);

    expect(customerContactService.isContactWriteConflict(error)).toBe(true);
  });

  it("creates a new person and assignment for a contact without an id", async () => {
    const primary = contactFixture();
    mocks.findDetail.mockResolvedValue(
      customerDetailFixture({ contacts: [primary] }),
    );
    const { tx: writeTx, insertedValues } = createContactTx();

    await customerContactService.synchronizeCustomerContacts(
      writeTx,
      TEST_CUSTOMER_ID,
      [
        toWriteContact(primary),
        {
          firstName: "Mara",
          lastName: "Kluge",
          email: "mara@nordlicht.example",
          phone: null,
          roleLabel: "Support",
          preferredLocale: "de",
          isPrimary: false,
        },
      ],
    );

    expect(insertedValues.map(({ table }) => table)).toEqual([
      people,
      customerContactAssignments,
    ]);
    const [personInsert, assignmentInsert] = insertedValues;
    expect(personInsert!.values).toMatchObject({
      display_name: "Mara Kluge",
      first_name: "Mara",
      last_name: "Kluge",
      primary_email: "mara@nordlicht.example",
      version: 1,
    });
    expect(assignmentInsert!.values).toMatchObject({
      customer_id: TEST_CUSTOMER_ID,
      person_id: personInsert!.values.id,
      is_primary: false,
      role_label: "Support",
      version: 1,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("deletes a non-primary contact that is omitted from the request", async () => {
    const primary = contactFixture();
    const secondary = contactFixture({
      id: "22222222-2222-4222-8222-222222222222",
      personId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      isPrimary: false,
    });
    mocks.findDetail.mockResolvedValue(
      customerDetailFixture({ contacts: [primary, secondary] }),
    );
    const { tx: writeTx, delete: del } = createContactTx();

    await customerContactService.synchronizeCustomerContacts(
      writeTx,
      TEST_CUSTOMER_ID,
      [toWriteContact(primary)],
    );

    expect(del).toHaveBeenCalledTimes(1);
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("deletes the current primary outright when it is not retained", async () => {
    const primary = contactFixture();
    const secondary = contactFixture({
      id: "22222222-2222-4222-8222-222222222222",
      personId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      isPrimary: false,
    });
    mocks.findDetail.mockResolvedValue(
      customerDetailFixture({ contacts: [primary, secondary] }),
    );
    const { tx: writeTx, delete: del } = createContactTx();

    await customerContactService.synchronizeCustomerContacts(
      writeTx,
      TEST_CUSTOMER_ID,
      [{ ...toWriteContact(secondary), isPrimary: true }],
    );

    expect(del).toHaveBeenCalledTimes(1);
  });

  it("raises a conflict when the delete of an omitted contact loses the version race", async () => {
    const primary = contactFixture();
    const secondary = contactFixture({
      id: "22222222-2222-4222-8222-222222222222",
      personId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      isPrimary: false,
    });
    mocks.findDetail.mockResolvedValue(
      customerDetailFixture({ contacts: [primary, secondary] }),
    );
    const { tx: writeTx } = createContactTx([]);

    const error = await customerContactService
      .synchronizeCustomerContacts(writeTx, TEST_CUSTOMER_ID, [
        toWriteContact(primary),
      ])
      .catch((caught: unknown) => caught);

    expect(customerContactService.isContactWriteConflict(error)).toBe(true);
  });

  it("rejects duplicate ids within the same request", async () => {
    const primary = contactFixture();
    mocks.findDetail.mockResolvedValue(
      customerDetailFixture({ contacts: [primary] }),
    );

    const error = await customerContactService
      .synchronizeCustomerContacts(tx, TEST_CUSTOMER_ID, [
        toWriteContact(primary),
        toWriteContact(primary),
      ])
      .catch((caught: unknown) => caught);

    expect(customerContactService.isContactWriteConflict(error)).toBe(true);
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("rejects a contact id that does not belong to this customer", async () => {
    const primary = contactFixture();
    mocks.findDetail.mockResolvedValue(
      customerDetailFixture({ contacts: [primary] }),
    );

    const error = await customerContactService
      .synchronizeCustomerContacts(tx, TEST_CUSTOMER_ID, [
        toWriteContact(primary),
        {
          ...toWriteContact(primary),
          id: "99999999-9999-4999-8999-999999999999",
        },
      ])
      .catch((caught: unknown) => caught);

    expect(customerContactService.isContactWriteConflict(error)).toBe(true);
  });

  it("rejects a personId that no longer matches the existing assignment", async () => {
    const primary = contactFixture();
    mocks.findDetail.mockResolvedValue(
      customerDetailFixture({ contacts: [primary] }),
    );

    const error = await customerContactService
      .synchronizeCustomerContacts(tx, TEST_CUSTOMER_ID, [
        {
          ...toWriteContact(primary),
          personId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        },
      ])
      .catch((caught: unknown) => caught);

    expect(customerContactService.isContactWriteConflict(error)).toBe(true);
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });
});
