import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { HOURS_CLOSED_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/crm/hours-closed-project-statuses";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { ProjectLineItemRow } from "@invessiv/common/contracts/crm/rows/project-line-item-row";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { projectLineItems } from "@invessiv/db/record-configuration";
import { canOn } from "@/common/patterns/auth/can-on";
import { businessToday } from "@/common/patterns/time/business-today";
import { feedbackRoundService } from "@/server/workspace/crm/services/feedback/feedback-round-service";
import { hoursActivityService } from "@/server/workspace/crm/services/hours/hours-activity-service";
import { hoursLedgerService } from "@/server/workspace/crm/services/hours/hours-ledger-service";
import type {
  AssignmentFields,
  AssignProjectLineItemFailureCode,
  AssignProjectLineItemInput,
  AssignProjectLineItemResult,
} from "./project-line-item-assignment-types";

function failure(
  code: AssignProjectLineItemFailureCode,
): AssignProjectLineItemResult {
  return { ok: false, code };
}

async function insertLineItem(
  tx: ContactDatabaseTransaction,
  input: AssignProjectLineItemInput,
  fields: AssignmentFields,
): Promise<ProjectLineItemRow> {
  const [row] = await tx
    .insert(projectLineItems)
    .values({
      id: crypto.randomUUID(),
      project_id: input.project.id,
      source_line_item_template_id: input.template.id,
      kind: input.template.kind,
      title: fields.title,
      description: fields.description,
      price_cents: fields.priceCents,
      pricing_mode: fields.pricingMode,
      recurring_interval: fields.recurringInterval,
      quantity_minutes: fields.quantityMinutes,
      status: fields.status,
      version: 1,
    })
    .returning();
  return row;
}

/**
 * Purchased hours are sold and credited in one step: the line item and the purchase row exist
 * together or not at all. By default the hours are allocated to this project in the same step;
 * the member can instead leave them in the customer's free stock, to be allocated to any project
 * later. Both ledger rows reuse the line item id as their idempotency key, so one assignment can
 * never credit twice.
 */
async function assignHours(
  tx: ContactDatabaseTransaction,
  input: AssignProjectLineItemInput,
): Promise<AssignProjectLineItemResult> {
  const { actor, project, fields } = input;
  const minutes = fields.quantityMinutes;
  if (
    minutes === null ||
    minutes > HoursLimits.MaxLedgerMinutes ||
    fields.pricingMode !== ServicePricingMode.Rate
  )
    return failure(ProjectLineItemErrorCode.ValidationError);
  if (!canOn(actor, Permission.HoursManage, { customerId: project.customerId }))
    return failure(ProjectLineItemErrorCode.EffectNotPermitted);
  // Only an allocation is refused by a closed project; free hours never touch it.
  if (
    fields.allocateHoursToProject &&
    HOURS_CLOSED_PROJECT_STATUS_VALUES.includes(project.status)
  )
    return failure(ProjectLineItemErrorCode.ProjectClosed);
  // The same lock as every other purchase and allocation of this customer.
  if (!(await hoursLedgerService.lockCustomer(tx, project.customerId)))
    return failure(ProjectLineItemErrorCode.ProjectNotFound);

  const row = await insertLineItem(tx, input, {
    ...fields,
    status: ProjectLineItemStatus.Confirmed,
  });
  const activityActor: ActivityActor = {
    type: ActorType.User,
    userId: actor.userId,
  };
  const purchase = await hoursLedgerService.insertPurchase(tx, {
    customerId: project.customerId,
    kind: HourPurchaseKind.Purchase,
    source: HourPurchaseSource.ProjectLineItem,
    minutes,
    purchasedOn: businessToday(),
    note: fields.title.slice(0, HoursLimits.NoteMaxLength),
    idempotencyKey: row.id,
    createdByMemberId: actor.workspaceMemberId,
  });
  await hoursActivityService.recordPurchase(tx, purchase, activityActor);
  if (!fields.allocateHoursToProject) return { ok: true, row };
  const allocation = await hoursLedgerService.insertAllocation(tx, {
    customerId: project.customerId,
    projectId: project.id,
    minutes,
    note: "",
    idempotencyKey: row.id,
    createdByMemberId: actor.workspaceMemberId,
  });
  await hoursActivityService.recordAllocation(tx, allocation, activityActor);
  return { ok: true, row };
}

/** A further round is sold together with its step in the process track. */
async function assignFeedbackRound(
  tx: ContactDatabaseTransaction,
  input: AssignProjectLineItemInput,
): Promise<AssignProjectLineItemResult> {
  const { actor, project, fields } = input;
  if (
    fields.quantityMinutes !== null ||
    fields.pricingMode !== ServicePricingMode.OneTime
  )
    return failure(ProjectLineItemErrorCode.ValidationError);
  if (
    !canOn(actor, Permission.ProjectsWrite, {
      customerId: project.customerId,
      projectId: project.id,
    })
  )
    return failure(ProjectLineItemErrorCode.EffectNotPermitted);
  const blocker = await feedbackRoundService.addExtraRoundStep(
    tx,
    project.id,
    actor,
  );
  if (blocker)
    return failure(ProjectLineItemErrorCode.FeedbackRoundNotAvailable);

  const row = await insertLineItem(tx, input, {
    ...fields,
    status: ProjectLineItemStatus.Confirmed,
  });
  return { ok: true, row };
}

/**
 * The only place a project line item is created. The caller has loaded the project, checked
 * `project_line_items.write` on it and made sure the template is active; what the kind needs on
 * top — managing hours, writing the project — is checked here, so the cockpit and an accepted
 * service request can never differ in what an assignment does.
 */
async function assign(
  tx: ContactDatabaseTransaction,
  input: AssignProjectLineItemInput,
): Promise<AssignProjectLineItemResult> {
  if (input.template.kind === LineItemKind.Hours) return assignHours(tx, input);
  if (input.template.kind === LineItemKind.FeedbackRound)
    return assignFeedbackRound(tx, input);
  if (input.fields.quantityMinutes !== null)
    return failure(ProjectLineItemErrorCode.ValidationError);
  return { ok: true, row: await insertLineItem(tx, input, input.fields) };
}

export const projectLineItemAssignmentService = { assign } as const;
