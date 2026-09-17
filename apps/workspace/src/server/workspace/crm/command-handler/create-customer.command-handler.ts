import "server-only";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import type { CreateCustomerRequestDto } from "@invessiv/common/contracts/crm/create-customer-request.dto";
import type { CreateCustomerResult } from "@invessiv/common/contracts/crm/results/create-customer-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { customerConstraintViolationService } from "@/server/workspace/crm/services/customer-constraint-violation-service";
import { customerService } from "@/server/workspace/crm/services/customer/customer-service";
import { customerReadService } from "@/server/workspace/crm/services/customer-read-service";
import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";
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
      const creation = await customerService.create(tx, data, actor);
      if (!creation.ok) {
        return creation;
      }

      const { customerId } = creation;
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
