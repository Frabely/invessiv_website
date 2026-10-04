import "server-only";

import { and, count, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { z } from "zod";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskFieldLimits } from "@invessiv/common/constants/crm/forms/task-field-limits";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import {
  SystemMessageKey,
  SystemMessageParam,
} from "@invessiv/common/constants/crm/system-message-keys";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import {
  OPEN_TASK_STATUS_VALUES,
  TaskStatus,
} from "@invessiv/common/constants/crm/task-statuses";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import { PortalTaskRequestLimits } from "@invessiv/common/constants/portal/portal-task-request-limits";
import type { CreatePortalTaskRequestDto } from "@invessiv/common/contracts/portal/create-portal-task-request.dto";
import type { CreateCustomerRequestTaskResult } from "@invessiv/common/contracts/portal/results/create-customer-request-task-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects, tasks } from "@invessiv/db/record-configuration";
import { businessToday } from "@/common/patterns/time/business-today";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";
import { announceSystemMessage } from "@/server/shared/services/message/announce-system-message";
import { projectResponsibleMemberService } from "@/server/shared/services/project-responsible-member-service";
import { taskActivityService } from "@/server/shared/services/task-activity-service";

const requestSchema = z.object({
  projectId: z.uuid(),
  title: z.string().trim().min(1).max(TaskFieldLimits.TitleMaxLength),
  description: z.string().trim().max(TaskFieldLimits.DescriptionMaxLength),
  dueOn: z.iso
    .date()
    .nullish()
    .transform((value) => value ?? null),
});

function failure(code: PortalTaskErrorCode): CreateCustomerRequestTaskResult {
  return { ok: false, code };
}

/**
 * A contact asks the team for something on one of the company's current projects. The task is the
 * team's to do and stays visible to the customer; the project's responsible member takes it, and
 * without one the request is refused instead of landing with nobody.
 *
 * The project row is locked, so parallel requests cannot pass the bound on open customer-created
 * tasks. Every miss — foreign company, completed or archived project, missing permission —
 * answers the same `not_found`.
 */
export async function createCustomerRequestTask(
  actor: PortalActor,
  input: CreatePortalTaskRequestDto,
): Promise<CreateCustomerRequestTaskResult> {
  const validation = requestSchema.safeParse(input);
  if (!validation.success) return failure(PortalTaskErrorCode.Validation);
  const data = validation.data;
  // A wish in the past can never be met; the form offers today as the earliest day.
  if (data.dueOn !== null && data.dueOn < businessToday())
    return failure(PortalTaskErrorCode.Validation);

  const db = getDrizzleDatabaseClient();
  return db.transaction(
    async (tx): Promise<CreateCustomerRequestTaskResult> => {
      const [project] = await tx
        .select({ id: projects.id, title: projects.title })
        .from(projects)
        .where(
          and(
            eq(projects.id, data.projectId),
            portalProjectCondition(actor, Permission.PortalTasksCreate),
            ne(projects.status, ProjectStatus.Completed),
          ),
        )
        .limit(1)
        .for("update");
      if (
        !project ||
        !portalCanOn.forActor(actor, Permission.PortalTasksCreate, {
          customerId: actor.customerId,
          projectId: project.id,
        })
      ) {
        return failure(PortalTaskErrorCode.NotFound);
      }

      const [open] = await tx
        .select({ total: count() })
        .from(tasks)
        .where(
          and(
            eq(tasks.project_id, project.id),
            isNotNull(tasks.created_by_portal_membership_id),
            inArray(tasks.status, OPEN_TASK_STATUS_VALUES),
          ),
        );
      if ((open?.total ?? 0) >= PortalTaskRequestLimits.OpenPerProject)
        return failure(PortalTaskErrorCode.LimitReached);

      const assigneeMemberId =
        await projectResponsibleMemberService.findActiveMemberId(
          tx,
          project.id,
        );
      if (!assigneeMemberId) return failure(PortalTaskErrorCode.NoAssignee);

      const taskId = crypto.randomUUID();
      await tx.insert(tasks).values({
        id: taskId,
        project_id: project.id,
        title: data.title,
        description: data.description,
        status: TaskStatus.Open,
        action_side: TaskActionSide.Internal,
        visible_to_customer: true,
        assignee_member_id: assigneeMemberId,
        due_on: data.dueOn,
        completed_at: null,
        completed_by_member_id: null,
        completed_by_portal_membership_id: null,
        created_by_portal_membership_id: actor.membershipId,
        feedback_round_id: null,
        onboarding_form_id: null,
        version: 1,
      });

      await taskActivityService.recordCreated(
        tx,
        { customerId: actor.customerId, projectId: project.id, taskId },
        portalActivityActor(actor),
      );
      await announceSystemMessage(
        tx,
        actor.customerId,
        SystemMessageKey.CustomerTaskRequested,
        {
          [SystemMessageParam.ProjectTitle]: project.title,
          [SystemMessageParam.TaskTitle]: data.title,
        },
      );

      return { ok: true, taskId };
    },
  );
}
