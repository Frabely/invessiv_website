import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { resolveCustomerContactDisplayName } from "@invessiv/common/patterns/crm/customer-contact-display-name";
import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";
import type { UpdateCustomerResult } from "@invessiv/common/contracts/crm/results/update-customer-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customerContactAssignments,
  customers,
  people,
} from "@invessiv/db/record-configuration";
import type { ValidatedUpdateCustomerInput } from "@/server/workspace/crm/crm-types";
import { customerCategoryService } from "@/server/workspace/crm/services/customer-category-service";
import { customerCategoryValidationService } from "@/server/workspace/crm/services/customer-category-validation-service";
import { customerConstraintViolationService } from "@/server/workspace/crm/services/customer-constraint-violation-service";
import { customerReadService } from "@/server/workspace/crm/services/customer-read-service";
import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";
import { customerWriteMappingService } from "@/server/workspace/crm/services/customer-write-mapping-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

class ContactWriteConflictError extends Error {}

async function applyContactWrites(
  tx: Parameters<typeof updateVersioned>[0]["tx"],
  customerId: string,
  contacts: NonNullable<ValidatedUpdateCustomerInput["contacts"]>,
) {
  const current = await customerReadService.findDetailById(tx, customerId);
  if (!current) throw new ContactWriteConflictError();

  const currentById = new Map(
    current.contacts.map((contact) => [contact.id, contact]),
  );
  const requestedExistingIds = new Set(
    contacts.flatMap((contact) => (contact.id ? [contact.id] : [])),
  );
  if (
    requestedExistingIds.size !==
      contacts.filter((contact) => contact.id).length ||
    [...requestedExistingIds].some((id) => !currentById.has(id))
  ) {
    throw new ContactWriteConflictError();
  }

  const currentPrimary = current.contacts.find((contact) => contact.isPrimary);
  const requestedPrimary = contacts.find((contact) => contact.isPrimary);
  const removedBeforeInsert = new Set<string>();
  if (currentPrimary && requestedPrimary?.id !== currentPrimary.id) {
    const source = contacts.find((contact) => contact.id === currentPrimary.id);
    if (source) {
      const demotion = await updateVersioned({
        tx,
        table: customerContactAssignments,
        id: currentPrimary.id,
        expectedVersion: source.assignmentVersion!,
        patch: { is_primary: false },
        toDto: (row) => row.id,
      });
      if (!demotion.ok) throw new ContactWriteConflictError();
    } else {
      const deleted = await tx
        .delete(customerContactAssignments)
        .where(
          and(
            eq(customerContactAssignments.id, currentPrimary.id),
            eq(
              customerContactAssignments.version,
              currentPrimary.assignmentVersion,
            ),
          ),
        )
        .returning({ id: customerContactAssignments.id });
      if (deleted.length !== 1) throw new ContactWriteConflictError();
      removedBeforeInsert.add(currentPrimary.id);
    }
  }

  for (const contact of contacts.filter((entry) => entry.id)) {
    const existing = currentById.get(contact.id!);
    if (!existing || existing.personId !== contact.personId)
      throw new ContactWriteConflictError();
    const personWrite = await updateVersioned({
      tx,
      table: people,
      id: contact.personId!,
      expectedVersion: contact.personVersion!,
      patch: {
        display_name: resolveCustomerContactDisplayName(contact),
        first_name: contact.firstName,
        last_name: contact.lastName,
        primary_email: contact.email,
        primary_phone: contact.phone,
        preferred_locale: contact.preferredLocale,
      },
      toDto: (row) => row.id,
    });
    if (!personWrite.ok) throw new ContactWriteConflictError();
    const assignmentWrite = await updateVersioned({
      tx,
      table: customerContactAssignments,
      id: contact.id!,
      expectedVersion:
        currentPrimary?.id === contact.id && requestedPrimary?.id !== contact.id
          ? contact.assignmentVersion! + 1
          : contact.assignmentVersion!,
      patch: { is_primary: contact.isPrimary, role_label: contact.roleLabel },
      toDto: (row) => row.id,
    });
    if (!assignmentWrite.ok) throw new ContactWriteConflictError();
  }

  for (const contact of contacts.filter((entry) => !entry.id)) {
    const personId = randomUUID();
    await tx.insert(people).values({
      id: personId,
      display_name: resolveCustomerContactDisplayName(contact),
      first_name: contact.firstName,
      last_name: contact.lastName,
      primary_email: contact.email,
      primary_phone: contact.phone,
      preferred_locale: contact.preferredLocale,
      notes: null,
      version: 1,
    });
    await tx.insert(customerContactAssignments).values({
      id: randomUUID(),
      customer_id: customerId,
      person_id: personId,
      role_label: contact.roleLabel,
      business_email: null,
      business_phone: null,
      is_primary: contact.isPrimary,
      version: 1,
    });
  }

  for (const contact of current.contacts) {
    if (
      requestedExistingIds.has(contact.id) ||
      removedBeforeInsert.has(contact.id)
    )
      continue;
    const deleted = await tx
      .delete(customerContactAssignments)
      .where(
        and(
          eq(customerContactAssignments.id, contact.id),
          eq(customerContactAssignments.version, contact.assignmentVersion),
        ),
      )
      .returning({ id: customerContactAssignments.id });
    if (deleted.length !== 1) throw new ContactWriteConflictError();
  }
}

export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerRequestDto,
): Promise<UpdateCustomerResult> {
  if (!customerSchemas.entityId.safeParse(customerId).success) {
    return { ok: false, code: CustomerErrorCode.CustomerNotFound };
  }

  const validation = customerSchemas.update.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: CustomerErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const data = validation.data;
  const db = getDrizzleDatabaseClient();

  try {
    return await db.transaction(async (tx): Promise<UpdateCustomerResult> => {
      if (
        data.categoryId &&
        !(await customerCategoryService.isActive(tx, data.categoryId))
      ) {
        return {
          ok: false,
          code: CustomerErrorCode.ValidationError,
          errors: [
            customerCategoryValidationService.createUnknownOrInactiveCategoryIssue(
              data.categoryId,
            ),
          ],
        };
      }

      const write = await updateVersioned({
        tx,
        table: customers,
        id: customerId,
        expectedVersion: data.version,
        patch: customerWriteMappingService.mapUpdateCustomerApiToDb(data),
        toDto: (row) => row.id,
      });

      if (!write.ok && write.code === ConcurrencyErrorCode.NotFound) {
        return { ok: false, code: CustomerErrorCode.CustomerNotFound };
      }

      // The versioned customer write must happen before any contact write. Returning a
      // customer conflict commits a transaction; ordering it this way guarantees that
      // such a return cannot commit only part of a form submission.
      if (!write.ok) {
        const customer = await customerReadService.findDetailById(
          tx,
          customerId,
        );
        if (!customer) {
          return { ok: false, code: CustomerErrorCode.CustomerNotFound };
        }
        return {
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          conflict: {
            code: ConcurrencyErrorCode.VersionConflict,
            currentVersion: customer.version,
            current: customer,
          },
        };
      }

      if (data.contacts) {
        await applyContactWrites(tx, customerId, data.contacts);
      }

      const customer = await customerReadService.findDetailById(tx, customerId);
      if (!customer) {
        return { ok: false, code: CustomerErrorCode.CustomerNotFound };
      }
      return { ok: true, customer };
    });
  } catch (error: unknown) {
    if (error instanceof ContactWriteConflictError) {
      const customer = await customerReadService.findDetailById(db, customerId);
      if (!customer) {
        return { ok: false, code: CustomerErrorCode.CustomerNotFound };
      }
      return {
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          code: ConcurrencyErrorCode.VersionConflict,
          currentVersion: customer.version,
          current: customer,
        },
      };
    }
    if (customerConstraintViolationService.isDisplayNameTaken(error)) {
      return { ok: false, code: CustomerErrorCode.DisplayNameTaken };
    }
    throw error;
  }
}
