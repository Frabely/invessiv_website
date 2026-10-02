import "server-only";

import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { tasks } from "@invessiv/db/record-configuration";
import { projectResponsibleMemberService } from "@/server/shared/services/project-responsible-member-service";
import { taskActivityService } from "@/server/shared/services/task-activity-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import type {
  CollectingTaskCreation,
  CollectingTaskMove,
} from "./collecting-task-types";

/**
 * Creates the one internal task that collects the team's work on a feedback round or an
 * onboarding form, assigned to the project's responsible member. Without an active owner there is
 * no task and no error: the customer's submit must never fail on internal staffing.
 */
async function create(
  tx: ContactDatabaseTransaction,
  { origin, scope, title, actor }: CollectingTaskCreation,
): Promise<void> {
  const assigneeMemberId =
    await projectResponsibleMemberService.findActiveMemberId(
      tx,
      scope.projectId,
    );
  if (!assigneeMemberId) {
    console.warn("[collecting-task] no active owner for the task", origin);
    return;
  }
  const taskId = crypto.randomUUID();
  await tx.insert(tasks).values({
    id: taskId,
    project_id: scope.projectId,
    title,
    description: "",
    status: TaskStatus.Open,
    action_side: TaskActionSide.Internal,
    visible_to_customer: false,
    assignee_member_id: assigneeMemberId,
    due_on: null,
    completed_at: null,
    completed_by_member_id: null,
    completed_by_portal_membership_id: null,
    feedback_round_id:
      "feedbackRoundId" in origin ? origin.feedbackRoundId : null,
    onboarding_form_id:
      "onboardingFormId" in origin ? origin.onboardingFormId : null,
    version: 1,
  });
  await taskActivityService.recordCreated(tx, { ...scope, taskId }, actor);
}

/**
 * Moves a task the caller has locked and decided to move; whether the current status allows it
 * stays with the caller, because a task someone changed by hand must keep that state.
 */
async function move(
  tx: ContactDatabaseTransaction,
  { task, scope, to, actor, completedByMemberId, failure }: CollectingTaskMove,
): Promise<void> {
  const becomesDone = to === TaskStatus.Done;
  await updateLockedVersioned(
    {
      tx,
      table: tasks,
      id: task.id,
      expectedVersion: task.version,
      patch: {
        status: to,
        completed_at: becomesDone ? new Date() : null,
        completed_by_member_id: becomesDone ? completedByMemberId : null,
        completed_by_portal_membership_id: null,
      },
    },
    failure,
  );
  await taskActivityService.recordStatusChange(
    tx,
    { ...scope, taskId: task.id },
    actor,
    { previous: task.status, next: to },
  );
}

export const collectingTaskService = { create, move } as const;
