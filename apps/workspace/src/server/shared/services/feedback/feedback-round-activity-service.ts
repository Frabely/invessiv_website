import "server-only";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import type { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  FEEDBACK_ROUND_ACTIVITY_ENTITY,
  FEEDBACK_ROUND_ACTIVITY_STATUS_FIELD,
} from "@/common/constants/crm/feedback-round-activity-metadata";
import { activityService } from "@/server/shared/services/activity-service";
import type { FeedbackRoundRef } from "./feedback-service-types";

/**
 * Existing activity types only: `activities.type` is checked against `ACTIVITY_TYPE_VALUES`, so the
 * round is marked through metadata. Feedback text never enters the append-only log.
 */
function baseInput(round: FeedbackRoundRef, actor: ActivityActor) {
  return {
    customerId: round.customer_id,
    projectId: round.project_id,
    actor,
  } as const;
}

function roundMetadata(round: FeedbackRoundRef) {
  return {
    entity: FEEDBACK_ROUND_ACTIVITY_ENTITY,
    feedback_round_id: round.id,
    round_number: round.round_number,
  } as const;
}

async function recordHandedOver(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  actor: ActivityActor,
): Promise<void> {
  await activityService.createActivity(tx, {
    ...baseInput(round, actor),
    type: ActivityType.Created,
    metadata: roundMetadata(round),
  });
}

async function recordSubmitted(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  actor: ActivityActor,
): Promise<void> {
  await activityService.createActivity(tx, {
    ...baseInput(round, actor),
    type: ActivityType.SubmissionReceived,
    metadata: roundMetadata(round),
  });
}

/** Every change after the submission, including the approval. */
async function recordStatusChange(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  actor: ActivityActor,
  change: { previous: FeedbackRoundStatus; next: FeedbackRoundStatus },
): Promise<void> {
  await activityService.createActivity(tx, {
    ...baseInput(round, actor),
    type: ActivityType.FieldChange,
    metadata: {
      ...roundMetadata(round),
      field: FEEDBACK_ROUND_ACTIVITY_STATUS_FIELD,
      previous: change.previous,
      next: change.next,
    },
  });
}

export const feedbackRoundActivityService = {
  recordHandedOver,
  recordSubmitted,
  recordStatusChange,
} as const;
