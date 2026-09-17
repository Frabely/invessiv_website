import "server-only";

import { eq } from "drizzle-orm";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import type { ConvertLeadToCustomerRequestDto } from "@invessiv/common/contracts/crm/convert-lead-to-customer-request.dto";
import type { ConvertLeadToCustomerResultDto } from "@invessiv/common/contracts/crm/convert-lead-to-customer-result.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  customerContactAssignments,
  customers,
  leads,
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
          const customer = await customerReadService.findDetailById(
            tx,
            lead.customerId,
            true,
          );
          if (!customer) {
            throw new Error("Converted lead references a missing customer");
          }
          return { ok: true, customer };
        }

        const ownerIsActive =
          await memberResponsibilityLockService.lockActiveMemberForAssignment(
            tx,
            actor.workspaceMemberId,
          );
        if (!ownerIsActive) {
          return { ok: false, code: LeadConversionErrorCode.OwnerInactive };
        }

        if (
          data.categoryId &&
          !(await customerCategoryService.isActive(tx, data.categoryId))
        ) {
          return {
            ok: false,
            code: LeadConversionErrorCode.ValidationError,
            errors: [
              customerCategoryValidationService.createUnknownOrInactiveCategoryIssue(
                data.categoryId,
              ),
            ],
          };
        }

        const customerId = crypto.randomUUID();
        const personId = crypto.randomUUID();
        await tx
          .insert(people)
          .values(
            customerWriteMappingService.mapContactApiToPersonDb(
              personId,
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
              personId,
              data.primaryContact,
              true,
            ),
          );
        for (const contact of data.additionalContacts ?? []) {
          const additionalPersonId = crypto.randomUUID();
          await tx
            .insert(people)
            .values(
              customerWriteMappingService.mapContactApiToPersonDb(
                additionalPersonId,
                contact,
              ),
            );
          await tx
            .insert(customerContactAssignments)
            .values(
              customerWriteMappingService.mapContactApiToAssignmentDb(
                crypto.randomUUID(),
                customerId,
                additionalPersonId,
                contact,
                false,
              ),
            );
        }

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

        const customer = await customerReadService.findDetailById(
          tx,
          customerId,
          true,
        );
        if (!customer) {
          throw new Error("Customer is missing after converting the lead");
        }
        return { ok: true, customer };
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
