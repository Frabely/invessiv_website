import "server-only";

import { and, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { CreateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/create-project-line-item-request.dto";
import type { CreateProjectLineItemResult } from "@invessiv/common/contracts/crm/results/create-project-line-item-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { lineItemTemplates, projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { projectLineItemAssignmentService } from "@/server/workspace/crm/services/project-line-item-assignment-service";
import { projectLineItemSchemas } from "@/server/workspace/crm/services/project-line-item-schemas";
import { projectLineItemsMapperService } from "@/server/workspace/crm/services/project-line-items-mapper-service";

/**
 * The customer is read from the project rather than taken from the request, so a project line item
 * can never be attached to a customer the caller addressed themselves. A project the actor may
 * not write answers like a missing one. What the assignment does beyond the line item — hours,
 * a further feedback round — happens in the same transaction or not at all.
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
    .select({ customerId: projects.customer_id, status: projects.status })
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

  const { sourceLineItemTemplateId, ...fields } = validation.data;
  // Archived templates stay readable as provenance but are never a source for a new assignment.
  const [template] = await db
    .select({ id: lineItemTemplates.id, kind: lineItemTemplates.kind })
    .from(lineItemTemplates)
    .where(
      and(
        eq(lineItemTemplates.id, sourceLineItemTemplateId),
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

  const assigned = await db.transaction((tx) =>
    projectLineItemAssignmentService.assign(tx, {
      actor,
      project: {
        id: projectId,
        customerId: project.customerId,
        status: project.status,
      },
      template: {
        id: template.id,
        kind: template.kind ?? LineItemKind.Standard,
      },
      fields,
    }),
  );
  if (!assigned.ok) {
    return assigned.code === ProjectLineItemErrorCode.ValidationError
      ? { ok: false, code: assigned.code, errors: [] }
      : { ok: false, code: assigned.code };
  }

  return {
    ok: true,
    projectLineItem: projectLineItemsMapperService.toDto(assigned.row),
  };
}
