import "server-only";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import {
  SystemMessageKey,
  SystemMessageParam,
} from "@invessiv/common/constants/crm/system-message-keys";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { onboardingForms } from "@invessiv/db/record-configuration";
import { ONBOARDING_FORM_ACTIVITY_ENTITY } from "@/common/constants/crm/onboarding-form-activity-metadata";
import { activityService } from "@/server/shared/services/activity-service";
import { announceSystemMessage } from "@/server/shared/services/message/announce-system-message";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import type {
  OnboardingChangeRequest,
  OnboardingCompletion,
  OnboardingCustomerTransition,
  OnboardingFormRow,
  OnboardingMemberTransition,
} from "./onboarding-form-types";
import { onboardingProjectStepService } from "./onboarding-project-step-service";
import { onboardingReviewService } from "./onboarding-review-service";
import { onboardingServicesSnapshotService } from "./onboarding-services-snapshot-service";
import { onboardingTaskService } from "./onboarding-task-service";

/** The one `status_change` entry of a step; answers never enter the log, `extra` stays small. */
async function recordStatusChange(
  tx: ContactDatabaseTransaction,
  previous: OnboardingFormRow,
  next: OnboardingFormRow,
  actor: ActivityActor,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await activityService.createActivity(tx, {
    customerId: next.customer_id,
    projectId: next.project_id,
    type: ActivityType.StatusChange,
    body: `${previous.status} → ${next.status}`,
    metadata: {
      entity: ONBOARDING_FORM_ACTIVITY_ENTITY,
      onboarding_form_id: next.id,
      previous_status: previous.status,
      next_status: next.status,
      ...extra,
    },
    actor,
  });
}

/**
 * Status changes of a form the handler has locked, with every side effect in the same transaction.
 * Whether the step is allowed decides the handler of its world through `ONBOARDING_FORM_TRANSITIONS`;
 * this service only carries it out, so activity and chat notice can never be forgotten on one path.
 *
 * A submission also reopens the review of the blocks the customer was asked about and makes sure
 * the form has its collecting task; the first submission finds neither.
 */
async function submit(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
  context: OnboardingCustomerTransition,
): Promise<OnboardingFormRow> {
  const submitted = await updateLockedVersioned(
    {
      tx,
      table: onboardingForms,
      id: form.id,
      expectedVersion: form.version,
      patch: {
        status: OnboardingFormStatus.Submitted,
        submitted_at: new Date(),
        submitted_by_portal_membership_id: context.portalMembershipId,
      },
    },
    "Locked onboarding form changed",
  );
  await onboardingReviewService.reopenRequested(tx, submitted.id);
  await onboardingTaskService.ensureForSubmission(tx, submitted, context.actor);
  // Answers never enter the append-only log; the entry only says that the form came in.
  await activityService.createActivity(tx, {
    customerId: submitted.customer_id,
    projectId: submitted.project_id,
    type: ActivityType.SubmissionReceived,
    metadata: {
      entity: ONBOARDING_FORM_ACTIVITY_ENTITY,
      onboarding_form_id: submitted.id,
    },
    actor: context.actor,
  });
  await announceSystemMessage(
    tx,
    submitted.customer_id,
    SystemMessageKey.OnboardingSubmitted,
    { [SystemMessageParam.ProjectTitle]: context.projectTitle },
  );
  return submitted;
}

/** Opens a draft for the customer: from here on the portal shows the form and takes answers. */
async function release(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
  context: OnboardingMemberTransition,
): Promise<OnboardingFormRow> {
  const released = await updateLockedVersioned(
    {
      tx,
      table: onboardingForms,
      id: form.id,
      expectedVersion: form.version,
      patch: {
        status: OnboardingFormStatus.Open,
        released_at: new Date(),
        released_by_member_id: context.memberId,
      },
    },
    "Locked onboarding form changed",
  );
  await recordStatusChange(tx, form, released, context.actor);
  await announceSystemMessage(
    tx,
    released.customer_id,
    SystemMessageKey.OnboardingReleased,
    { [SystemMessageParam.ProjectTitle]: context.projectTitle },
  );
  return released;
}

/**
 * Hands a submitted form back to the customer. The questions go into the activity, because the
 * review rows lose them once the form comes in again; the chat notice only names the blocks.
 */
async function requestChanges(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
  context: OnboardingChangeRequest,
): Promise<OnboardingFormRow> {
  const requested = await updateLockedVersioned(
    {
      tx,
      table: onboardingForms,
      id: form.id,
      expectedVersion: form.version,
      patch: { status: OnboardingFormStatus.ChangesRequested },
    },
    "Locked onboarding form changed",
  );
  await recordStatusChange(tx, form, requested, context.actor, {
    clarifications: context.requested.map((block) => ({
      block_id: block.blockId,
      note: block.note,
    })),
  });
  await announceSystemMessage(
    tx,
    requested.customer_id,
    SystemMessageKey.OnboardingChangesRequested,
    {
      [SystemMessageParam.ProjectTitle]: context.projectTitle,
      [SystemMessageParam.BlockTitles]: context.requested
        .map((block) => block.title)
        .join(", "),
    },
  );
  return requested;
}

/**
 * Closes a submitted form for good. The services are frozen before the status changes, because
 * from `completed` on the form reads the snapshot instead of the project's line items. The phase
 * moves last and announces itself, so the chat reads "completed" before "next phase".
 */
async function complete(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
  context: OnboardingCompletion,
): Promise<OnboardingFormRow> {
  await onboardingServicesSnapshotService.freeze(tx, form);
  const completed = await updateLockedVersioned(
    {
      tx,
      table: onboardingForms,
      id: form.id,
      expectedVersion: form.version,
      patch: {
        status: OnboardingFormStatus.Completed,
        completed_at: new Date(),
        completed_by_member_id: context.memberId,
        call_held_on: context.callHeldOn,
      },
    },
    "Locked onboarding form changed",
  );
  await onboardingTaskService.completeForForm(
    tx,
    completed,
    context.actor,
    context.memberId,
  );
  await recordStatusChange(tx, form, completed, context.actor);
  await announceSystemMessage(
    tx,
    completed.customer_id,
    SystemMessageKey.OnboardingCompleted,
    { [SystemMessageParam.ProjectTitle]: context.projectTitle },
  );
  if (context.advancePhase)
    await onboardingProjectStepService.advancePastOnboarding(tx, completed);
  return completed;
}

export const onboardingFormTransitionService = {
  complete,
  release,
  requestChanges,
  submit,
} as const;
