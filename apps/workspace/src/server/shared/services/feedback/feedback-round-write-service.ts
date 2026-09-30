import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import {
  SystemMessageKey,
  SystemMessageParam,
} from "@invessiv/common/constants/crm/system-message-keys";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { feedbackRounds } from "@invessiv/db/record-configuration";
import { announceSystemMessage } from "@/server/shared/services/message/announce-system-message";
import type { VersionedPatch } from "@/server/workspace/shared/update-versioned-types";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import { feedbackProjectStepService } from "./feedback-project-step-service";
import { feedbackRoundActivityService } from "./feedback-round-activity-service";
import { feedbackRoundItemService } from "./feedback-round-item-service";
import { feedbackRoundTaskService } from "./feedback-round-task-service";
import type {
  FeedbackCustomerWrite,
  FeedbackDraftItemInput,
  FeedbackMemberWrite,
  FeedbackRoundRef,
  FeedbackRoundRow,
} from "./feedback-service-types";

/**
 * Writes on a round the handler has locked, with every side effect of the step in the same
 * transaction: task, activity, chat notice. Which step is allowed decides the handler of its world;
 * this service only carries it out, so activity and notice can never be forgotten on one path.
 */
function writeRound(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  patch: VersionedPatch<typeof feedbackRounds>,
): Promise<FeedbackRoundRow> {
  return updateLockedVersioned(
    {
      tx,
      table: feedbackRounds,
      id: round.id,
      expectedVersion: round.version,
      patch,
    },
    "Locked feedback round changed",
  );
}

/** Every feedback notice names the project and the round, in CRM and portal alike. */
function announce(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  projectTitle: string,
  key: SystemMessageKey,
): Promise<void> {
  return announceSystemMessage(tx, round.customer_id, key, {
    [SystemMessageParam.ProjectTitle]: projectTitle,
    [SystemMessageParam.RoundNumber]: String(round.round_number),
  });
}

/** The round row itself is inserted by the handover command; this records what follows it. */
async function recordHandOver(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  context: { actor: ActivityActor; projectTitle: string },
): Promise<void> {
  await feedbackRoundActivityService.recordHandedOver(tx, round, context.actor);
  await announce(
    tx,
    round,
    context.projectTitle,
    SystemMessageKey.FeedbackRoundHandedOver,
  );
}

/** Saving a draft advances the round version, so a parallel save of another contact gets a 409. */
async function saveDraft(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  items: readonly FeedbackDraftItemInput[],
  portalMembershipId: string,
): Promise<FeedbackRoundRow> {
  const saved = await writeRound(tx, round, {
    draft_updated_at: new Date(),
    draft_updated_by_portal_membership_id: portalMembershipId,
  });
  await feedbackRoundItemService.replaceDraftItems(
    tx,
    saved,
    items,
    portalMembershipId,
  );
  return saved;
}

async function submit(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  context: FeedbackCustomerWrite,
): Promise<FeedbackRoundRow> {
  // A notice belongs to the step it announced; the handback notice ends with the resubmission.
  const submitted = await writeRound(tx, round, {
    status: FeedbackRoundStatus.Submitted,
    submitted_at: new Date(),
    submitted_by_portal_membership_id: context.portalMembershipId,
    customer_notice: null,
  });
  await feedbackRoundTaskService.ensureOpenForSubmission(
    tx,
    submitted,
    context.actor,
  );
  await feedbackRoundActivityService.recordSubmitted(
    tx,
    submitted,
    context.actor,
  );
  await announce(
    tx,
    submitted,
    context.projectTitle,
    SystemMessageKey.FeedbackRoundSubmitted,
  );
  return submitted;
}

/** The approval also moves the project track behind the round, under the project lock. */
async function approve(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  context: FeedbackCustomerWrite,
): Promise<FeedbackRoundRow> {
  const approved = await writeRound(tx, round, {
    status: FeedbackRoundStatus.Approved,
    approved_at: new Date(),
    approved_by_portal_membership_id: context.portalMembershipId,
  });
  await feedbackProjectStepService.advancePastFeedbackRound(
    tx,
    approved.project_id,
    approved.round_number,
  );
  await feedbackRoundActivityService.recordStatusChange(
    tx,
    approved,
    context.actor,
    { previous: round.status, next: approved.status },
  );
  await announce(
    tx,
    approved,
    context.projectTitle,
    SystemMessageKey.FeedbackApproved,
  );
  return approved;
}

/** The team asks for a call; the optional notice tells the customer what about. */
async function requestDiscussion(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  context: FeedbackMemberWrite & { customerNotice: string | null },
): Promise<FeedbackRoundRow> {
  const changed = await writeRound(tx, round, {
    status: FeedbackRoundStatus.InDiscussion,
    customer_notice: context.customerNotice,
  });
  await feedbackRoundActivityService.recordStatusChange(
    tx,
    changed,
    { type: ActorType.User, userId: context.actor.userId },
    { previous: round.status, next: changed.status },
  );
  await announce(
    tx,
    changed,
    context.projectTitle,
    SystemMessageKey.FeedbackRoundDiscussionRequested,
  );
  return changed;
}

/** Starting the work moves the collecting task along; the customer learns it from the round status. */
async function startImplementation(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  context: FeedbackMemberWrite,
): Promise<FeedbackRoundRow> {
  const changed = await writeRound(tx, round, {
    status: FeedbackRoundStatus.InProgress,
    started_at: new Date(),
    customer_notice: null,
  });
  await feedbackRoundTaskService.markInProgress(tx, changed, context.actor);
  await feedbackRoundActivityService.recordStatusChange(
    tx,
    changed,
    { type: ActorType.User, userId: context.actor.userId },
    { previous: round.status, next: changed.status },
  );
  return changed;
}

/**
 * Hands the round back to the customer: items stay, the submission stamp goes, the collecting task
 * is cancelled until the next submission reopens it. `read_at` resets, so a resubmission shows up
 * as new again.
 */
async function returnToCustomer(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  context: FeedbackMemberWrite & { customerNotice: string },
): Promise<FeedbackRoundRow> {
  const changed = await writeRound(tx, round, {
    status: FeedbackRoundStatus.Open,
    customer_notice: context.customerNotice,
    submitted_at: null,
    submitted_by_portal_membership_id: null,
    read_at: null,
  });
  await feedbackRoundTaskService.cancelForReturn(tx, changed, context.actor);
  await feedbackRoundActivityService.recordStatusChange(
    tx,
    changed,
    { type: ActorType.User, userId: context.actor.userId },
    { previous: round.status, next: changed.status },
  );
  await announce(
    tx,
    changed,
    context.projectTitle,
    SystemMessageKey.FeedbackRoundReturned,
  );
  return changed;
}

/** The handler has checked that every item has a result; the task is done in the same transaction. */
async function complete(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  context: FeedbackMemberWrite,
): Promise<FeedbackRoundRow> {
  const changed = await writeRound(tx, round, {
    status: FeedbackRoundStatus.Completed,
    completed_at: new Date(),
    completed_by_member_id: context.actor.workspaceMemberId,
  });
  await feedbackRoundTaskService.completeForRound(tx, changed, context.actor);
  await feedbackRoundActivityService.recordStatusChange(
    tx,
    changed,
    { type: ActorType.User, userId: context.actor.userId },
    { previous: round.status, next: changed.status },
  );
  await announce(
    tx,
    changed,
    context.projectTitle,
    SystemMessageKey.FeedbackRoundCompleted,
  );
  return changed;
}

export const feedbackRoundWriteService = {
  recordHandOver,
  saveDraft,
  submit,
  approve,
  requestDiscussion,
  startImplementation,
  returnToCustomer,
  complete,
} as const;
