import "server-only";

import { eq } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HOURS_CLOSED_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/crm/hours-closed-project-statuses";
import type { CreateTimeEntryRequestDto } from "@invessiv/common/contracts/crm/hours/create-time-entry-request.dto";
import type { CreateTimeEntryResult } from "@invessiv/common/contracts/crm/results/create-time-entry-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  projects,
  projectTimeEntries,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { businessToday } from "@/common/patterns/time/business-today";
import { hoursBalanceService } from "@/server/shared/services/hours/hours-balance-service";
import { hoursActivityService } from "@/server/workspace/crm/services/hours/hours-activity-service";
import { hoursMappingService } from "@/server/workspace/crm/services/hours/hours-mapping-service";
import { hoursSchemas } from "@/server/workspace/crm/services/hours/hours-schemas";
import { timeEntryAccessService } from "@/server/workspace/crm/services/hours/time-entry-access-service";

/**
 * Books time on one project. Nothing is compared against the allocated hours: overdrawing a
 * project is allowed and shown, and it never draws from another project. The customer is read from
 * the project, and the booking member is always the caller. A project the actor may not book on
 * answers like a missing one.
 */
export async function createTimeEntry(
  projectId: string,
  input: CreateTimeEntryRequestDto,
  actor: WorkspaceActor,
): Promise<CreateTimeEntryResult> {
  if (!hoursSchemas.entityId.safeParse(projectId).success) {
    return { ok: false, code: HoursErrorCode.ProjectNotFound };
  }

  const today = businessToday();
  const validation = hoursSchemas.createTimeEntry
    .refine((data) => data.performedOn <= today, { path: ["performedOn"] })
    .safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: HoursErrorCode.ValidationError,
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
    !canOn(actor, Permission.HoursWrite, {
      customerId: project.customerId,
      projectId,
    })
  ) {
    return { ok: false, code: HoursErrorCode.ProjectNotFound };
  }
  if (HOURS_CLOSED_PROJECT_STATUS_VALUES.includes(project.status)) {
    return { ok: false, code: HoursErrorCode.ProjectClosed };
  }

  const data = validation.data;
  if (
    data.taskId &&
    !(await timeEntryAccessService.isTaskLinkable(db, data.taskId, projectId))
  ) {
    return { ok: false, code: HoursErrorCode.TaskNotLinkable };
  }

  return db.transaction(async (tx): Promise<CreateTimeEntryResult> => {
    const [row] = await tx
      .insert(projectTimeEntries)
      .values({
        id: crypto.randomUUID(),
        customer_id: project.customerId,
        project_id: projectId,
        task_id: data.taskId,
        performed_on: data.performedOn,
        duration_minutes: data.durationMinutes,
        description: data.description,
        billable: data.billable,
        performed_by_member_id: actor.workspaceMemberId,
        version: 1,
      })
      .returning();
    await hoursActivityService.recordTimeEntryCreated(tx, row, {
      type: ActorType.User,
      userId: actor.userId,
    });

    const balance = await hoursBalanceService.loadProjectBalance(
      tx,
      project.customerId,
      projectId,
    );
    if (!balance) return { ok: false, code: HoursErrorCode.ProjectNotFound };
    return {
      ok: true,
      timeEntry: hoursMappingService.toTimeEntryDto(row),
      project: balance,
    };
  });
}
