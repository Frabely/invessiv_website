import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { OnboardingClarificationMode } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { RequestOnboardingChangesRequestDto } from "@invessiv/common/contracts/crm/onboarding/request-onboarding-changes-request.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import { listOnboardingClarificationBlocks } from "@invessiv/common/patterns/crm/onboarding/onboarding-review";
import { resolveQuestionnaireText } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { DEFAULT_LOCALE } from "@/lib/site-metadata";
import { onboardingFormTransitionService } from "@/server/shared/services/onboarding/onboarding-form-transition-service";
import { onboardingFormCommandSupport } from "@/server/workspace/crm/services/onboarding/onboarding-form-command-support";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";

/**
 * Hands a submitted form back to the customer under the form lock. Only the blocks with a
 * question for the customer open again in the portal; without one there is nothing to hand back.
 * Questions for the call stay with the team and do not block the request.
 */
export async function requestOnboardingChanges(
  formId: string,
  input: RequestOnboardingChangesRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<OnboardingFormDto>> {
  const parsed = onboardingFormCommandSupport.parse(
    formId,
    onboardingFormSchemas.requestChanges,
    input,
  );
  if (!parsed.ok) return parsed.result;

  return onboardingFormCommandSupport.runFormTransition({
    formId,
    actor,
    target: OnboardingFormStatus.ChangesRequested,
    expectedVersion: parsed.data.expectedVersion,
    command: async (tx, form, toDto) => {
      const requested = listOnboardingClarificationBlocks(
        (await toDto(form)).blocks,
        OnboardingClarificationMode.Customer,
      );
      if (requested.length === 0)
        return { ok: false, code: OnboardingErrorCode.ReviewIncomplete };

      return {
        next: await onboardingFormTransitionService.requestChanges(tx, form, {
          actor: { type: ActorType.User, userId: actor.userId },
          memberId: actor.workspaceMemberId,
          projectTitle: await onboardingFormCommandSupport.loadProjectTitle(
            tx,
            form,
          ),
          // One chat notice serves every contact, so the titles come in the default language.
          requested: requested.map((step) => ({
            blockId: step.block.id,
            title:
              resolveQuestionnaireText(step.block.translations, DEFAULT_LOCALE)
                ?.text.title ?? step.block.key,
            note: step.reviewNote ?? "",
          })),
        }),
      };
    },
  });
}
