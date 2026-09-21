import "server-only";

import { and, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { CreateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/create-project-line-item-request.dto";
import type { CreateProjectLineItemResult } from "@invessiv/common/contracts/crm/results/create-project-line-item-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  projectLineItems,
  projects,
  lineItemTemplates,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { projectLineItemSchemas } from "@/server/workspace/crm/services/project-line-item-schemas";
import { projectLineItemsMapperService } from "@/server/workspace/crm/services/project-line-items-mapper-service";

/**
 * The customer is read from the project rather than taken from the request, so a project line item
 * can never be attached to a customer the caller addressed themselves. A project the actor may
 * not write answers like a missing one.
 */
export async function createProjectLineItem(
  projectId: string,
  input: CreateProjectLineItemRequestDto,
  actor: WorkspaceActor,
): Promise<CreateProjectLineItemResult> {
  if (!projectLineItemSchemas.entityId.safeParse(projectId).success) {
    return { ok: false, code: ProjectLineItemErrorCode.ProjectNotFound };
  }

  const validation = projectLineItemSchemas.create.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: ProjectLineItemErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const db = getDrizzleDatabaseClient();
  const [project] = await db
    .select({ customerId: projects.customer_id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (
    !project ||
    !canOn(actor, Permission.ProjectLineItemsWrite, {
      customerId: project.customerId,
      projectId,
    })
  ) {
    return { ok: false, code: ProjectLineItemErrorCode.ProjectNotFound };
  }

  const data = validation.data;
  // Archived templates stay readable as provenance but are never a source for a new assignment.
  const [template] = await db
    .select({ id: lineItemTemplates.id })
    .from(lineItemTemplates)
    .where(
      and(
        eq(lineItemTemplates.id, data.sourceLineItemTemplateId),
        eq(lineItemTemplates.status, LineItemTemplateStatus.Active),
      ),
    )
    .limit(1);
  if (!template) {
    return {
      ok: false,
      code: ProjectLineItemErrorCode.LineItemTemplateNotAssignable,
    };
  }

  const [row] = await db
    .insert(projectLineItems)
    .values({
      id: crypto.randomUUID(),
      project_id: projectId,
      source_line_item_template_id: template.id,
      title: data.title,
      description: data.description,
      price_cents: data.priceCents,
      pricing_mode: data.pricingMode,
      recurring_interval: data.recurringInterval,
      version: 1,
    })
    .returning();

  return {
    ok: true,
    projectLineItem: projectLineItemsMapperService.toDto(row),
  };
}
