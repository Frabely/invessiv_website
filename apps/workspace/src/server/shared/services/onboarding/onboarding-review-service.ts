import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import type { ReviewOnboardingBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/review-onboarding-block-request.dto";
import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import { onboardingFormBlocks } from "@invessiv/db/record-configuration";
import {
  updateLockedVersionedBy,
  updateLockedVersionedSet,
} from "@/server/workspace/shared/update-versioned";
import type { OnboardingFormBlockRow } from "./onboarding-form-types";

/** The steps of a form with their review, in form order. */
function listSteps(
  executor: ContactDatabaseReader,
  formId: string,
): Promise<OnboardingFormBlockRow[]> {
  return executor
    .select()
    .from(onboardingFormBlocks)
    .where(eq(onboardingFormBlocks.form_id, formId))
    .orderBy(asc(onboardingFormBlocks.position));
}

async function findStep(
  executor: ContactDatabaseReader,
  formId: string,
  blockId: string,
): Promise<OnboardingFormBlockRow | null> {
  const [step] = await executor
    .select()
    .from(onboardingFormBlocks)
    .where(
      and(
        eq(onboardingFormBlocks.form_id, formId),
        eq(onboardingFormBlocks.block_id, blockId),
      ),
    )
    .limit(1);
  return step ?? null;
}

/**
 * Writes one review against the block's composite key while the caller holds the form lock.
 */
async function writeReview(
  tx: ContactDatabaseTransaction,
  step: OnboardingFormBlockRow,
  review: ReviewOnboardingBlockRequestDto,
  memberId: string,
): Promise<OnboardingFormBlockRow> {
  const pending = review.reviewStatus === OnboardingBlockReviewStatus.Pending;
  return updateLockedVersionedBy(
    {
      tx,
      table: onboardingFormBlocks,
      where: and(
        eq(onboardingFormBlocks.form_id, step.form_id),
        eq(onboardingFormBlocks.block_id, step.block_id),
      ),
      expectedVersion: step.version,
      patch: {
        review_status: review.reviewStatus,
        clarification_mode:
          "clarificationMode" in review ? review.clarificationMode : null,
        review_note: "note" in review ? review.note : null,
        reviewed_by_member_id: pending ? null : memberId,
        reviewed_at: pending ? null : new Date(),
      },
    },
    "Locked onboarding review changed",
  );
}

/**
 * Puts every block the customer was asked about back to `pending` once the form comes in again.
 * The question itself stays in the activity of the change request; every other block keeps its
 * result, a question for the call included.
 */
async function reopenRequested(
  tx: ContactDatabaseTransaction,
  formId: string,
): Promise<void> {
  await updateLockedVersionedSet({
    tx,
    table: onboardingFormBlocks,
    where: and(
      eq(onboardingFormBlocks.form_id, formId),
      eq(
        onboardingFormBlocks.review_status,
        OnboardingBlockReviewStatus.Clarification,
      ),
      eq(
        onboardingFormBlocks.clarification_mode,
        OnboardingClarificationMode.Customer,
      ),
    ),
    patch: {
      review_status: OnboardingBlockReviewStatus.Pending,
      clarification_mode: null,
      review_note: null,
      reviewed_by_member_id: null,
      reviewed_at: null,
    },
  });
}

export const onboardingReviewService = {
  findStep,
  listSteps,
  reopenRequested,
  writeReview,
} as const;
