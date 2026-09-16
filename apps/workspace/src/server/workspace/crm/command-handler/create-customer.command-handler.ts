import "server-only";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import type { CreateCustomerRequestDto } from "@invessiv/common/contracts/crm/create-customer-request.dto";
import type { CreateCustomerResult } from "@invessiv/common/contracts/crm/results/create-customer-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customerContactAssignments,
  customers,
  people,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { memberResponsibilityLockService } from "@/server/workspace/access/services/responsibilities/member-responsibility-lock-service";
import { customerCategoryService } from "@/server/workspace/crm/services/customer-category-service";
import { customerCategoryValidationService } from "@/server/workspace/crm/services/customer-category-validation-service";
import { customerConstraintViolationService } from "@/server/workspace/crm/services/customer-constraint-violation-service";
import { customerReadService } from "@/server/workspace/crm/services/customer-read-service";
import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";
import { customerWriteMappingService } from "@/server/workspace/crm/services/customer-write-mapping-service";
import { activityService } from "@/server/workspace/shared/services/activity-service";

/**
 * Customer, person, primary assignment and the `created` activity commit together or not
 * at all — a customer is never visible without its primary contact.
 */
export async function createCustomer(
  input: CreateCustomerRequestDto,
  actor: WorkspaceActor,
): Promise<CreateCustomerResult> {
  const validation = customerSchemas.create.safeParse(input);
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
    return await db.transaction(async (tx): Promise<CreateCustomerResult> => {
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
            customerWriteMappingService.mapContactApiToPersonDb(
              personId,
              contact,
            ),
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
      await activityService.createActivity(tx, {
        customerId,
        type: ActivityType.Created,
        actor: { type: ActorType.User, userId: actor.userId },
      });

      const customer = await customerReadService.findDetailById(tx, customerId);
      if (!customer) {
        throw new Error("Customer is missing after creating it");
      }

      return { ok: true, customer };
    });
  } catch (error: unknown) {
    if (customerConstraintViolationService.isDisplayNameTaken(error)) {
      return { ok: false, code: CustomerErrorCode.DisplayNameTaken };
    }
    throw error;
  }
}
