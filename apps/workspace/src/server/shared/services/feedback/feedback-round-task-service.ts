import "server-only";

import { eq } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { tasks } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { DEFAULT_LOCALE } from "@/lib/site-metadata";
import { collectingTaskService } from "@/server/shared/services/collecting-task-service";
import type { FeedbackRoundRef } from "./feedback-service-types";

function scopeOf(round: FeedbackRoundRef) {
  return { customerId: round.customer_id, projectId: round.project_id };
}

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
  await collectingTaskService.move(tx, {
    task,
    scope: scopeOf(round),
    to: change.to,
    actor,
    completedByMemberId,
    failure: "Locked feedback round task changed",
  });
}

/**
 * Creates the one internal task of a submitted round, or reopens it after the team handed the round
 * back.
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
  await collectingTaskService.create(tx, {
    origin: { feedbackRoundId: round.id },
    scope: scopeOf(round),
    title: formatMessage(
      getCrmTasksDictionary(DEFAULT_LOCALE).feedbackRound.title,
      { roundNumber: round.round_number },
    ),
    actor,
  });
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
