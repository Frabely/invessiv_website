import "server-only";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import {
  SystemMessageKey,
  SystemMessageParam,
} from "@invessiv/common/constants/crm/system-message-keys";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { onboardingForms } from "@invessiv/db/record-configuration";
import { ONBOARDING_FORM_ACTIVITY_ENTITY } from "@/common/constants/crm/onboarding-form-activity-metadata";
import { activityService } from "@/server/shared/services/activity-service";
import { announceSystemMessage } from "@/server/shared/services/message/announce-system-message";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import type {
  OnboardingCustomerTransition,
  OnboardingFormRow,
  OnboardingMemberTransition,
} from "./onboarding-form-types";

/**
 * Status changes of a form the handler has locked, with every side effect in the same transaction.
 * Whether the step is allowed decides the handler of its world through `ONBOARDING_FORM_TRANSITIONS`;
 * this service only carries it out, so activity and chat notice can never be forgotten on one path.
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
  await activityService.createActivity(tx, {
    customerId: released.customer_id,
    projectId: released.project_id,
    type: ActivityType.StatusChange,
    body: `${form.status} → ${released.status}`,
    metadata: {
      entity: ONBOARDING_FORM_ACTIVITY_ENTITY,
      onboarding_form_id: released.id,
      previous_status: form.status,
      next_status: released.status,
    },
    actor: context.actor,
  });
  await announceSystemMessage(
    tx,
    released.customer_id,
    SystemMessageKey.OnboardingReleased,
    { [SystemMessageParam.ProjectTitle]: context.projectTitle },
  );
  return released;
}

export const onboardingFormTransitionService = { release, submit } as const;
