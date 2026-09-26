import "server-only";

import { eq } from "drizzle-orm";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import type { ConvertLeadToCustomerRequestDto } from "@invessiv/common/contracts/crm/convert-lead-to-customer-request.dto";
import type { ConvertLeadToCustomerResultDto } from "@invessiv/common/contracts/crm/convert-lead-to-customer-result.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { activities, leads } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { customerConstraintViolationService } from "@/server/workspace/crm/services/customer-constraint-violation-service";
import { customerService } from "@/server/workspace/crm/services/customer/customer-service";
import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";
import { activityService } from "@/server/shared/services/activity-service";

/**
 * Locks the lead first, making the link itself the idempotency record for retries and
 * concurrent requests. Every write then commits in the same transaction.
 */
export async function convertLeadToCustomer(
  leadId: string,
  input: ConvertLeadToCustomerRequestDto,
  actor: WorkspaceActor,
): Promise<ConvertLeadToCustomerResultDto> {
  const validation = customerSchemas.create.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: LeadConversionErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const data = validation.data;
  const db = getDrizzleDatabaseClient();

  try {
    return await db.transaction(
      async (tx): Promise<ConvertLeadToCustomerResultDto> => {
        const [lead] = await tx
          .select({ customerId: leads.customer_id })
          .from(leads)
          .where(eq(leads.id, leadId))
          .limit(1)
          .for("update");

        if (!lead) {
          return { ok: false, code: LeadConversionErrorCode.LeadNotFound };
        }

        if (lead.customerId) {
          return { ok: true, customerId: lead.customerId };
        }

        const creation = await customerService.create(tx, data, actor);
        if (!creation.ok) {
          return {
            ok: false,
            code:
              creation.code === CustomerErrorCode.OwnerInactive
                ? LeadConversionErrorCode.OwnerInactive
                : LeadConversionErrorCode.ValidationError,
            ...(creation.code === CustomerErrorCode.ValidationError
              ? { errors: creation.errors }
              : {}),
          };
        }

        const { customerId } = creation;

        await tx
          .update(leads)
          .set({
            customer_id: customerId,
            lead_status: ContactLeadStatus.Won,
            updated_at: new Date(),
          })
          .where(eq(leads.id, leadId));
        await tx
          .update(activities)
          .set({ customer_id: customerId })
          .where(eq(activities.lead_id, leadId));
        await activityService.createActivity(tx, {
          leadId,
          customerId,
          type: ActivityType.ConvertedFromLead,
          actor: { type: ActorType.User, userId: actor.userId },
        });

        return { ok: true, customerId };
      },
    );
  } catch (error: unknown) {
    if (customerConstraintViolationService.isDisplayNameTaken(error)) {
      return {
        ok: false,
        code: LeadConversionErrorCode.DisplayNameTaken,
      };
    }
    throw error;
  }
}
