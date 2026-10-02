import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { ReleaseOnboardingFormRequestDto } from "@invessiv/common/contracts/crm/onboarding/release-onboarding-form-request.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  isOnboardingFormReleasable,
  listOnboardingReleaseWarnings,
} from "@invessiv/common/patterns/crm/onboarding/onboarding-release-check";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { people, portalMemberships } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormTransitionService } from "@/server/shared/services/onboarding/onboarding-form-transition-service";
import { onboardingFormCommandSupport } from "@/server/workspace/crm/services/onboarding/onboarding-form-command-support";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";

/** Preferred languages of the contacts who can open the customer's portal right now. */
async function listContactLocales(
  tx: ContactDatabaseTransaction,
  customerId: string,
): Promise<Locale[]> {
  const rows = await tx
    .selectDistinct({ locale: people.preferred_locale })
    .from(portalMemberships)
    .innerJoin(people, eq(people.id, portalMemberships.person_id))
    .where(
      and(
        eq(portalMemberships.customer_id, customerId),
        isNull(portalMemberships.revoked_at),
      ),
    );
  return rows.map((row) => row.locale);
}

/**
 * Releases a draft to the portal under the form lock. A form that asks nothing is refused; missing
 * texts in a contact's language and a customer without portal contact come back as warnings until
 * the team acknowledges them. The structure stays editable afterwards, the customer then sees
 * every change at once.
 */
export async function releaseOnboardingForm(
  formId: string,
  input: ReleaseOnboardingFormRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<OnboardingFormDto>> {
  const parsed = onboardingFormCommandSupport.parse(
    formId,
    onboardingFormSchemas.release,
    input,
  );
  if (!parsed.ok) return parsed.result;

  return onboardingFormCommandSupport.runFormTransition({
    formId,
    actor,
    target: OnboardingFormStatus.Open,
    expectedVersion: parsed.data.expectedVersion,
    command: async (tx, form, toDto) => {
      const blocks = (await toDto(form)).blocks.map((step) => step.block);
      if (!isOnboardingFormReleasable(blocks))
        return { ok: false, code: QuestionnaireErrorCode.InvalidFieldConfig };
      if (!parsed.data.acknowledgeWarnings) {
        const warnings = listOnboardingReleaseWarnings(
          blocks,
          await listContactLocales(tx, form.customer_id),
        );
        if (warnings.length > 0)
          return {
            ok: false,
            code: OnboardingErrorCode.ReleaseWarnings,
            warnings,
          };
      }

      return {
        next: await onboardingFormTransitionService.release(tx, form, {
          actor: { type: ActorType.User, userId: actor.userId },
          memberId: actor.workspaceMemberId,
          projectTitle: await onboardingFormCommandSupport.loadProjectTitle(
            tx,
            form,
          ),
        }),
      };
    },
  });
}
