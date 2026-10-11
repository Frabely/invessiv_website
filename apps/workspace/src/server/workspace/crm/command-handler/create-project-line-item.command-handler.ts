import "server-only";

import { and, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { CreateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/create-project-line-item-request.dto";
import type { CreateProjectLineItemResult } from "@invessiv/common/contracts/crm/results/create-project-line-item-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  lineItemTemplates,
  projectLineItems,
  projects,
} from "@invessiv/db/record-configuration";
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
  const {
    sourceLineItemTemplateId,
    sourceLineItemTemplateVersion,
    idempotencyKey,
    ...fields
  } = validation.data;
  const assigned = await db.transaction(async (tx) => {
    // NO KEY UPDATE serializes status changes without blocking foreign-key inserts.
    const [project] = await tx
      .select({ customerId: projects.customer_id, status: projects.status })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .for("no key update");
    if (
      !project ||
      !canOn(actor, Permission.ProjectLineItemsWrite, {
        customerId: project.customerId,
        projectId,
      })
    ) {
      return {
        ok: false,
        code: ProjectLineItemErrorCode.ProjectNotFound,
      } as const;
    }
    // Resolve replays before checking a template that may since have been archived or changed.
    if (idempotencyKey) {
      const [existing] = await tx
        .select()
        .from(projectLineItems)
        .where(eq(projectLineItems.id, idempotencyKey))
        .limit(1);
      if (existing) {
        if (existing.project_id !== projectId) {
          return {
            ok: false,
            code: ProjectLineItemErrorCode.ValidationError,
          } as const;
        }
        return { ok: true, row: existing } as const;
      }
    }
    const [template] = await tx
      .select({
        id: lineItemTemplates.id,
        kind: lineItemTemplates.kind,
        version: lineItemTemplates.version,
      })
      .from(lineItemTemplates)
      .where(
        and(
          eq(lineItemTemplates.id, sourceLineItemTemplateId),
          eq(lineItemTemplates.status, LineItemTemplateStatus.Active),
        ),
      )
      .limit(1)
      .for("share");
    if (!template)
      return {
        ok: false,
        code: ProjectLineItemErrorCode.LineItemTemplateNotAssignable,
      } as const;
    if (
      sourceLineItemTemplateVersion !== undefined &&
      sourceLineItemTemplateVersion !== template.version
    ) {
      return {
        ok: false,
        code: ProjectLineItemErrorCode.LineItemTemplateChanged,
      } as const;
    }
    return projectLineItemAssignmentService.assign(tx, {
      actor,
      idempotencyKey,
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
    });
  });
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
