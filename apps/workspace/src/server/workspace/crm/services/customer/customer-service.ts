import "server-only";

import type { z } from "zod";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customerContactAssignments,
  customers,
  people,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { memberResponsibilityLockService } from "@/server/workspace/access/services/responsibilities/member-responsibility-lock-service";
import { customerCategoryService } from "@/server/workspace/crm/services/customer-category-service";
import { customerCategoryValidationService } from "@/server/workspace/crm/services/customer-category-validation-service";
import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";
import { customerWriteMappingService } from "@/server/workspace/crm/services/customer-write-mapping-service";

type CustomerCreationInput = z.infer<typeof customerSchemas.create>;

type CustomerCreationResult =
  | { ok: true; customerId: string }
  | { ok: false; code: typeof CustomerErrorCode.OwnerInactive }
  | {
      ok: false;
      code: typeof CustomerErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    };

async function createCustomer(
  tx: ContactDatabaseTransaction,
  data: CustomerCreationInput,
  actor: WorkspaceActor,
): Promise<CustomerCreationResult> {
  const ownerIsActive =
    await memberResponsibilityLockService.lockActiveMemberForAssignment(
      tx,
      actor.workspaceMemberId,
    );
  if (!ownerIsActive) {
    return { ok: false, code: CustomerErrorCode.OwnerInactive };
  }

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

  const customerId = crypto.randomUUID();
  const primaryPersonId = crypto.randomUUID();
  await tx
    .insert(people)
    .values(
      customerWriteMappingService.mapContactApiToPersonDb(
        primaryPersonId,
        data.primaryContact,
      ),
    );
  await tx
    .insert(customers)
    .values(
      customerWriteMappingService.mapCreateCustomerApiToDb(
        customerId,
        data,
        actor.workspaceMemberId,
      ),
    );
  await tx
    .insert(customerContactAssignments)
    .values(
      customerWriteMappingService.mapContactApiToAssignmentDb(
        crypto.randomUUID(),
        customerId,
        primaryPersonId,
        data.primaryContact,
        true,
      ),
    );

  for (const contact of data.additionalContacts ?? []) {
    const personId = crypto.randomUUID();
    await tx
      .insert(people)
      .values(
        customerWriteMappingService.mapContactApiToPersonDb(personId, contact),
      );
    await tx
      .insert(customerContactAssignments)
      .values(
        customerWriteMappingService.mapContactApiToAssignmentDb(
          crypto.randomUUID(),
          customerId,
          personId,
          contact,
          false,
        ),
      );
  }

  return { ok: true, customerId };
}

export const customerService = { create: createCustomer } as const;
