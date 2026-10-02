import "server-only";

import { eq } from "drizzle-orm";

import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { tasks } from "@invessiv/db/record-configuration";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { DEFAULT_LOCALE } from "@/lib/site-metadata";
import { projectResponsibleMemberService } from "@/server/shared/services/project-responsible-member-service";
import { taskActivityService } from "@/server/shared/services/task-activity-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import type { OnboardingFormRow } from "./onboarding-form-types";

/**
 * Creates the one internal task of a submitted form, so it is not overlooked. A form that already
 * has its task keeps it untouched: a change request leaves it open, a second submission adds none,
 * and whatever someone changed by hand stays. Without an active owner there is no task and no
 * error — submitting must never fail on internal staffing.
 */
async function ensureForSubmission(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
  actor: ActivityActor,
): Promise<void> {
  const [existing] = await tx
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.onboarding_form_id, form.id))
    .for("update");
  if (existing) return;

  const assigneeMemberId =
    await projectResponsibleMemberService.findActiveMemberId(
      tx,
      form.project_id,
    );
  if (!assigneeMemberId) {
    console.warn("[onboarding] no active owner for the collecting task", {
      onboardingFormId: form.id,
    });
    return;
  }
  const taskId = crypto.randomUUID();
  await tx.insert(tasks).values({
    id: taskId,
    project_id: form.project_id,
    title: getCrmTasksDictionary(DEFAULT_LOCALE).onboardingForm.title,
    description: "",
    status: TaskStatus.Open,
    action_side: TaskActionSide.Internal,
    visible_to_customer: false,
    assignee_member_id: assigneeMemberId,
    due_on: null,
    completed_at: null,
    completed_by_member_id: null,
    completed_by_portal_membership_id: null,
    feedback_round_id: null,
    onboarding_form_id: form.id,
    version: 1,
  });
  await taskActivityService.recordCreated(
    tx,
    { customerId: form.customer_id, projectId: form.project_id, taskId },
    actor,
  );
}

/**
 * Closes the collecting task with the form. Only a task that is still open or in progress moves;
 * one someone cancelled or finished by hand keeps that state.
 */
async function completeForForm(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
  actor: ActivityActor,
  memberId: string,
): Promise<void> {
  const [task] = await tx
    .select()
    .from(tasks)
    .where(eq(tasks.onboarding_form_id, form.id))
    .for("update");
  if (
    !task ||
    (task.status !== TaskStatus.Open && task.status !== TaskStatus.InProgress)
  )
    return;
  await updateLockedVersioned(
    {
      tx,
      table: tasks,
      id: task.id,
      expectedVersion: task.version,
      patch: {
        status: TaskStatus.Done,
        completed_at: new Date(),
        completed_by_member_id: memberId,
        completed_by_portal_membership_id: null,
      },
    },
    "Locked onboarding task changed",
  );
  await taskActivityService.recordStatusChange(
    tx,
    {
      customerId: form.customer_id,
      projectId: form.project_id,
      taskId: task.id,
    },
    actor,
    { previous: task.status, next: TaskStatus.Done },
  );
}

export const onboardingTaskService = {
  completeForForm,
  ensureForSubmission,
} as const;
