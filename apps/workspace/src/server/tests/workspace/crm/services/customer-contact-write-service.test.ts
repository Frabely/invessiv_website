import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CustomerContactAssignmentDto } from "@invessiv/common/contracts/crm/customer-contact.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { customerContactAssignments } from "@invessiv/db/record-configuration";
import { customerContactWriteService } from "@/server/workspace/crm/services/customer-contact-write-service";
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

describe("customerContactWriteService", () => {
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

    await customerContactWriteService.synchronizeCustomerContacts(
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

    const error = await customerContactWriteService
      .synchronizeCustomerContacts(tx, TEST_CUSTOMER_ID, [
        { ...toWriteContact(primary), roleLabel: "Managing partner" },
      ])
      .catch((caught: unknown) => caught);

    expect(customerContactWriteService.isContactWriteConflict(error)).toBe(
      true,
    );
  });
});
