import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { CompleteOnboardingFormRequestDto } from "@invessiv/common/contracts/crm/onboarding/complete-onboarding-form-request.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import { isOnboardingCallDateAcceptable } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { businessToday } from "@/common/patterns/time/business-today";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import { onboardingFormTransitionService } from "@/server/shared/services/onboarding/onboarding-form-transition-service";
import { onboardingFormCommandSupport } from "@/server/workspace/crm/services/onboarding/onboarding-form-command-support";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";

/**
 * Completes a submitted form under the form lock. Two things must hold: no visible required
 * answer is missing, computed with the same function the portal submits with, and the call took
 * place. Unreviewed blocks and questions kept for the call do not block; their state stays as
 * history. Snapshot, status, task, phase, activity and chat notice succeed or fail together.
 */
export async function completeOnboardingForm(
  formId: string,
  input: CompleteOnboardingFormRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<OnboardingFormDto>> {
  const parsed = onboardingFormCommandSupport.parse(
    formId,
    onboardingFormSchemas.complete,
    input,
  );
  if (!parsed.ok) return parsed.result;
  const { expectedVersion, callHeldOn, advancePhase } = parsed.data;

  return onboardingFormCommandSupport.runFormTransition({
    formId,
    actor,
    target: OnboardingFormStatus.Completed,
    expectedVersion,
    command: async (tx, form) => {
      if (!isOnboardingCallDateAcceptable(callHeldOn, businessToday()))
        return { ok: false, code: OnboardingErrorCode.CallDateRequired };
      const { missing } = await onboardingFormReadService.toCompleteness(
        tx,
        form,
      );
      if (missing.length > 0)
        return {
          ok: false,
          code: OnboardingErrorCode.RequiredMissing,
          missing: [...missing],
        };

      return {
        next: await onboardingFormTransitionService.complete(tx, form, {
          actor: { type: ActorType.User, userId: actor.userId },
          memberId: actor.workspaceMemberId,
          projectTitle: await onboardingFormCommandSupport.loadProjectTitle(
            tx,
            form,
          ),
          callHeldOn,
          advancePhase,
        }),
      };
    },
  });
}
