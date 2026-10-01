import "server-only";

import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { OnboardingTransitionSide } from "@invessiv/common/constants/crm/onboarding/onboarding-transition-sides";
import { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import { canTransitionOnboardingForm } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import { onboardingFormTransitionService } from "@/server/shared/services/onboarding/onboarding-form-transition-service";

/**
 * Hands the form to the team and locks it for the customer. Completeness is computed again under
 * the form lock with the same function the portal page uses, so a stale tab cannot submit a form
 * that lacks a visible required answer. The chat notice runs in a savepoint and never blocks.
 */
export async function submitPortalOnboarding(
  actor: PortalActor,
  formId: string,
): Promise<PortalOnboardingResult<PortalOnboardingFormSummaryDto>> {
  return portalOnboardingService.withLockedForm(
    actor,
    formId,
    async (tx, { form, projectTitle }) => {
      if (
        !canTransitionOnboardingForm(
          form.status,
          OnboardingFormStatus.Submitted,
          OnboardingTransitionSide.Customer,
        )
      )
        return { ok: false, code: PortalOnboardingErrorCode.Locked };

      const { missing } = await onboardingFormReadService.toCompleteness(
        tx,
        form,
      );
      if (missing.length > 0)
        return {
          ok: false,
          code: PortalOnboardingErrorCode.RequiredMissing,
          missing: [...missing],
        };

      const submitted = await onboardingFormTransitionService.submit(tx, form, {
        actor: portalActivityActor(actor),
        portalMembershipId: actor.membershipId,
        projectTitle,
      });
      return {
        ok: true,
        value: await portalOnboardingService.toSummaryDto(tx, actor, {
          form: submitted,
          projectTitle,
        }),
      };
    },
  );
}
