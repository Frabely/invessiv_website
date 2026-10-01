import "server-only";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { MoveOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/move-onboarding-form-block-request.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";
import { onboardingFormStructureService } from "@/server/workspace/crm/services/onboarding/onboarding-form-structure-service";

/** One step up or down in the step order of a form. */
export async function moveOnboardingFormBlock(
  formId: string,
  blockId: string,
  input: MoveOnboardingFormBlockRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<OnboardingFormDto>> {
  if (!onboardingFormSchemas.entityId.safeParse(blockId).success)
    return { ok: false, code: QuestionnaireErrorCode.BlockNotFound };
  const parsed = onboardingFormSchemas.moveBlock.safeParse(input);
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
    (tx, form) =>
      onboardingFormStructureService.moveStep(
        tx,
        form.id,
        blockId,
        parsed.data.direction,
      ),
  );
}
