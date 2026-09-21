import "server-only";

import { eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { UpdateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/update-project-line-item-request.dto";
import type { UpdateProjectLineItemResult } from "@invessiv/common/contracts/crm/results/update-project-line-item-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projectLineItems, projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { projectLineItemSchemas } from "@/server/workspace/crm/services/project-line-item-schemas";
import { projectLineItemsMapperService } from "@/server/workspace/crm/services/project-line-items-mapper-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

/**
 * Editing a snapshot never touches its origin template and never reaches another project: the
 * write is scoped by the project the row already belongs to.
 */
export async function updateProjectLineItem(
  projectLineItemId: string,
  input: UpdateProjectLineItemRequestDto,
  actor: WorkspaceActor,
): Promise<UpdateProjectLineItemResult> {
  // An id that is not a UUID at all can never match a row; treated the same as a missing one.
  if (!projectLineItemSchemas.entityId.safeParse(projectLineItemId).success) {
    return {
      ok: false,
      code: ProjectLineItemErrorCode.ProjectLineItemNotFound,
    };
  }

  const validation = projectLineItemSchemas.update.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: ProjectLineItemErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const db = getDrizzleDatabaseClient();
  const [target] = await db
    .select({
      customerId: projects.customer_id,
      projectId: projectLineItems.project_id,
    })
    .from(projectLineItems)
    .innerJoin(projects, eq(projects.id, projectLineItems.project_id))
    .where(eq(projectLineItems.id, projectLineItemId))
    .limit(1);
  if (
    !target ||
    !canOn(actor, Permission.ProjectLineItemsWrite, {
      customerId: target.customerId,
      projectId: target.projectId,
    })
  ) {
    return {
      ok: false,
      code: ProjectLineItemErrorCode.ProjectLineItemNotFound,
    };
  }

  const data = validation.data;
  const write = await db.transaction((tx) =>
    updateVersioned({
      tx,
      table: projectLineItems,
      id: projectLineItemId,
      expectedVersion: data.version,
      patch: {
        title: data.title,
        description: data.description,
        price_cents: data.priceCents,
        pricing_mode: data.pricingMode,
        recurring_interval: data.recurringInterval,
      },
      toDto: projectLineItemsMapperService.toDto,
    }),
  );

  if (write.ok) {
    return { ok: true, projectLineItem: write.value };
  }
  if (write.code === ConcurrencyErrorCode.NotFound) {
    return {
      ok: false,
      code: ProjectLineItemErrorCode.ProjectLineItemNotFound,
    };
  }
  return {
    ok: false,
    code: ConcurrencyErrorCode.VersionConflict,
    conflict: write.conflict,
  };
}
