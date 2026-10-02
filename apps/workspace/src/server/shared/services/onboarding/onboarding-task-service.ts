import "server-only";

import { eq } from "drizzle-orm";

import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { tasks } from "@invessiv/db/record-configuration";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { DEFAULT_LOCALE } from "@/lib/site-metadata";
import { collectingTaskService } from "@/server/shared/services/collecting-task-service";
import type { OnboardingFormRow } from "./onboarding-form-types";

function scopeOf(form: OnboardingFormRow) {
  return { customerId: form.customer_id, projectId: form.project_id };
}

/**
 * Creates the one internal task of a submitted form, so it is not overlooked. A form that already
 * has its task keeps it untouched: a change request leaves it open, a second submission adds none,
 * and whatever someone changed by hand stays.
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

  await collectingTaskService.create(tx, {
    origin: { onboardingFormId: form.id },
    scope: scopeOf(form),
    title: getCrmTasksDictionary(DEFAULT_LOCALE).onboardingForm.title,
    actor,
  });
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
  await collectingTaskService.move(tx, {
    task,
    scope: scopeOf(form),
    to: TaskStatus.Done,
    actor,
    completedByMemberId: memberId,
    failure: "Locked onboarding task changed",
  });
}

export const onboardingTaskService = {
  completeForForm,
  ensureForSubmission,
} as const;
