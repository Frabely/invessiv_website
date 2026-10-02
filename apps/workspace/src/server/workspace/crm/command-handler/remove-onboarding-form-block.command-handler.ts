import "server-only";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { RemoveOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/remove-onboarding-form-block-request.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";
import { onboardingFormStructureService } from "@/server/workspace/crm/services/onboarding/onboarding-form-structure-service";

/**
 * Removes a block from a form for good: its definition, answers and file links. The files stay in
 * the customer's file area, only their link to the form is gone.
 */
export async function removeOnboardingFormBlock(
  formId: string,
  blockId: string,
  input: RemoveOnboardingFormBlockRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<OnboardingFormDto>> {
  if (!onboardingFormSchemas.entityId.safeParse(blockId).success)
    return { ok: false, code: QuestionnaireErrorCode.BlockNotFound };
  const parsed = onboardingFormSchemas.removeBlock.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: OnboardingErrorCode.ValidationError,
      errors: parsed.error.issues,
    };

  return onboardingFormStructureService.runBlockListCommand(
    formId,
    parsed.data.expectedFormVersion,
    actor,
    (tx, form) => onboardingFormStructureService.removeStep(tx, form, blockId),
  );
}
