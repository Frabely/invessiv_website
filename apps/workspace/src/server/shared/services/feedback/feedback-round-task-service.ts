import "server-only";

import { eq } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { tasks } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { DEFAULT_LOCALE } from "@/lib/site-metadata";
import { projectResponsibleMemberService } from "@/server/shared/services/project-responsible-member-service";
import { taskActivityService } from "@/server/shared/services/task-activity-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import type { FeedbackRoundRef } from "./feedback-service-types";

async function lockRoundTask(tx: ContactDatabaseTransaction, roundId: string) {
  const [task] = await tx
    .select()
    .from(tasks)
    .where(eq(tasks.feedback_round_id, roundId))
    .for("update");
  return task ?? null;
}

/**
 * Moves the collecting task only out of the status the round flow left it in. A task someone
 * changed by hand keeps that state, so the round never overwrites a manual decision.
 */
async function moveTask(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  change: { from: TaskStatus; to: TaskStatus },
  actor: ActivityActor,
  completedByMemberId: string | null = null,
): Promise<void> {
  const task = await lockRoundTask(tx, round.id);
  if (!task || task.status !== change.from) return;
  const becomesDone = change.to === TaskStatus.Done;
  await updateLockedVersioned(
    {
      tx,
      table: tasks,
      id: task.id,
      expectedVersion: task.version,
      patch: {
        status: change.to,
        completed_at: becomesDone ? new Date() : null,
        completed_by_member_id: becomesDone ? completedByMemberId : null,
        completed_by_portal_membership_id: null,
      },
    },
    "Locked feedback round task changed",
  );
  await taskActivityService.recordStatusChange(
    tx,
    {
      customerId: round.customer_id,
      projectId: round.project_id,
      taskId: task.id,
    },
    actor,
    { previous: change.from, next: change.to },
  );
}

/**
 * Creates the one internal task of a submitted round, or reopens it after the team handed the round
 * back. Without an active owner there is no task: submitting must never fail on internal staffing.
 */
async function ensureOpenForSubmission(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  actor: ActivityActor,
): Promise<void> {
  const existing = await lockRoundTask(tx, round.id);
  if (existing) {
    await moveTask(
      tx,
      round,
      { from: TaskStatus.Cancelled, to: TaskStatus.Open },
      actor,
    );
    return;
  }
  const assigneeMemberId =
    await projectResponsibleMemberService.findActiveMemberId(
      tx,
      round.project_id,
    );
  if (!assigneeMemberId) {
    console.warn("[feedback-round] no active owner for the collecting task", {
      feedbackRoundId: round.id,
    });
    return;
  }
  const taskId = crypto.randomUUID();
  await tx.insert(tasks).values({
    id: taskId,
    project_id: round.project_id,
    title: formatMessage(
      getCrmTasksDictionary(DEFAULT_LOCALE).feedbackRound.title,
      { roundNumber: round.round_number },
    ),
    description: "",
    status: TaskStatus.Open,
    action_side: TaskActionSide.Internal,
    visible_to_customer: false,
    assignee_member_id: assigneeMemberId,
    due_on: null,
    completed_at: null,
    completed_by_member_id: null,
    completed_by_portal_membership_id: null,
    feedback_round_id: round.id,
    version: 1,
  });
  await taskActivityService.recordCreated(
    tx,
    { customerId: round.customer_id, projectId: round.project_id, taskId },
    actor,
  );
}

function memberActor(actor: WorkspaceActor): ActivityActor {
  return { type: ActorType.User, userId: actor.userId };
}

async function markInProgress(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  actor: WorkspaceActor,
): Promise<void> {
  await moveTask(
    tx,
    round,
    { from: TaskStatus.Open, to: TaskStatus.InProgress },
    memberActor(actor),
  );
}

async function cancelForReturn(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  actor: WorkspaceActor,
): Promise<void> {
  await moveTask(
    tx,
    round,
    { from: TaskStatus.Open, to: TaskStatus.Cancelled },
    memberActor(actor),
  );
}

async function completeForRound(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  actor: WorkspaceActor,
): Promise<void> {
  await moveTask(
    tx,
    round,
    { from: TaskStatus.InProgress, to: TaskStatus.Done },
    memberActor(actor),
    actor.workspaceMemberId,
  );
}

export const feedbackRoundTaskService = {
  ensureOpenForSubmission,
  markInProgress,
  cancelForReturn,
  completeForRound,
} as const;
