import "server-only";

import { eq } from "drizzle-orm";

import type { InsertHourAllocationInput } from "@invessiv/db/contracts/crm/hours/insert-hour-allocation-input";
import type { InsertHourPurchaseInput } from "@invessiv/db/contracts/crm/hours/insert-hour-purchase-input";
import type { HourAllocationRow } from "@invessiv/common/contracts/crm/rows/hour-allocation-row";
import type { HourPurchaseRow } from "@invessiv/common/contracts/crm/rows/hour-purchase-row";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customerHourPurchases,
  customers,
  projectHourAllocations,
} from "@invessiv/db/record-configuration";

/**
 * Serializes every purchase, allocation and release of one customer: the rules compare sums over
 * several rows, so two writers must never read the same sums. `NO KEY UPDATE` is enough for that
 * and leaves inserts that merely reference the customer (tasks, files, time entries) unblocked.
 */
async function lockCustomer(
  tx: ContactDatabaseTransaction,
  customerId: string,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)
    .for("no key update");
  return !!row;
}

async function findPurchaseByKey(
  tx: ContactDatabaseTransaction,
  idempotencyKey: string,
): Promise<HourPurchaseRow | undefined> {
  const [row] = await tx
    .select()
    .from(customerHourPurchases)
    .where(eq(customerHourPurchases.idempotency_key, idempotencyKey))
    .limit(1);
  return row;
}

async function findAllocationByKey(
  tx: ContactDatabaseTransaction,
  idempotencyKey: string,
): Promise<HourAllocationRow | undefined> {
  const [row] = await tx
    .select()
    .from(projectHourAllocations)
    .where(eq(projectHourAllocations.idempotency_key, idempotencyKey))
    .limit(1);
  return row;
}

/** `source` is an argument on purpose: later folders record purchases that nobody typed in. */
async function insertPurchase(
  tx: ContactDatabaseTransaction,
  input: InsertHourPurchaseInput,
): Promise<HourPurchaseRow> {
  const [row] = await tx
    .insert(customerHourPurchases)
    .values({
      id: crypto.randomUUID(),
      customer_id: input.customerId,
      kind: input.kind,
      source: input.source,
      minutes: input.minutes,
      purchased_on: input.purchasedOn,
      note: input.note,
      idempotency_key: input.idempotencyKey,
      created_by_member_id: input.createdByMemberId,
    })
    .returning();
  return row;
}

async function insertAllocation(
  tx: ContactDatabaseTransaction,
  input: InsertHourAllocationInput,
): Promise<HourAllocationRow> {
  const [row] = await tx
    .insert(projectHourAllocations)
    .values({
      id: crypto.randomUUID(),
      customer_id: input.customerId,
      project_id: input.projectId,
      minutes: input.minutes,
      note: input.note,
      idempotency_key: input.idempotencyKey,
      created_by_member_id: input.createdByMemberId,
    })
    .returning();
  return row;
}

export const hoursLedgerService = {
  lockCustomer,
  findPurchaseByKey,
  findAllocationByKey,
  insertPurchase,
  insertAllocation,
} as const;
