import "server-only";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { ReviewOnboardingBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/review-onboarding-block-request.dto";
import { isOnboardingReviewOpen } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import { onboardingReviewService } from "@/server/shared/services/onboarding/onboarding-review-service";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { onboardingFormAccessService } from "@/server/workspace/crm/services/onboarding/onboarding-form-access-service";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";
import { versionConflict } from "@/server/workspace/shared/version-conflict";

/**
 * Sets the team's review of one block under the form lock. The review is only open while the form
 * lies with the team; the customer's resubmission takes the same lock, so a review never lands on
 * a block the customer is editing. The form version stays as it is: two members reviewing
 * different blocks must not run into each other.
 */
export async function reviewOnboardingBlock(
  formId: string,
  blockId: string,
  input: ReviewOnboardingBlockRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<OnboardingFormDto>> {
  if (!onboardingFormSchemas.entityId.safeParse(formId).success)
    return { ok: false, code: OnboardingErrorCode.FormNotFound };
  if (!onboardingFormSchemas.entityId.safeParse(blockId).success)
    return { ok: false, code: QuestionnaireErrorCode.BlockNotFound };
  const parsed = onboardingFormSchemas.review.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: OnboardingErrorCode.ValidationError,
      errors: parsed.error.issues,
    };

  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const form = await onboardingFormAccessService.lockWritableForm(
      tx,
      formId,
      actor,
    );
    if (!form) return { ok: false, code: OnboardingErrorCode.FormNotFound };
    if (!isOnboardingReviewOpen(form.status))
      return { ok: false, code: OnboardingErrorCode.InvalidTransition };
    const step = await onboardingReviewService.findStep(tx, form.id, blockId);
    if (!step) return { ok: false, code: QuestionnaireErrorCode.BlockNotFound };

    const toDto = () =>
      onboardingFormReadService.toFormDto(
        tx,
        form,
        fileAccessService.readableCondition(actor),
      );
    if (step.version !== parsed.data.expectedVersion)
      return versionConflict(step.version, await toDto());

    await onboardingReviewService.writeReview(
      tx,
      step,
      parsed.data,
      actor.workspaceMemberId,
    );
    return { ok: true, value: await toDto() };
  });
}
