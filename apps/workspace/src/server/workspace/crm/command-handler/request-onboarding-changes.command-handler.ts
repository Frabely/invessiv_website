import "server-only";

import { eq } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { OnboardingClarificationMode } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { OnboardingTransitionSide } from "@invessiv/common/constants/crm/onboarding/onboarding-transition-sides";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { RequestOnboardingChangesRequestDto } from "@invessiv/common/contracts/crm/onboarding/request-onboarding-changes-request.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import { canTransitionOnboardingForm } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { listOnboardingClarificationBlocks } from "@invessiv/common/patterns/crm/onboarding/onboarding-review";
import { resolveQuestionnaireText } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { DEFAULT_LOCALE } from "@/lib/site-metadata";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import { onboardingFormTransitionService } from "@/server/shared/services/onboarding/onboarding-form-transition-service";
import type { OnboardingFormRow } from "@/server/shared/services/onboarding/onboarding-form-types";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { onboardingFormAccessService } from "@/server/workspace/crm/services/onboarding/onboarding-form-access-service";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";

const FORM_NOT_FOUND = {
  ok: false,
  code: OnboardingErrorCode.FormNotFound,
} as const;

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
  if (!onboardingFormSchemas.entityId.safeParse(formId).success)
    return FORM_NOT_FOUND;
  const parsed = onboardingFormSchemas.requestChanges.safeParse(input);
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
    if (!form) return FORM_NOT_FOUND;
    // Checked before the version: a form that already went back stays so whatever the client read.
    if (
      !canTransitionOnboardingForm(
        form.status,
        OnboardingFormStatus.ChangesRequested,
        OnboardingTransitionSide.Internal,
      )
    )
      return { ok: false, code: OnboardingErrorCode.InvalidTransition };

    const toDto = (row: OnboardingFormRow) =>
      onboardingFormReadService.toFormDto(
        tx,
        row,
        fileAccessService.readableCondition(actor),
      );
    const current = await toDto(form);
    if (form.version !== parsed.data.expectedVersion)
      return {
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          code: ConcurrencyErrorCode.VersionConflict,
          currentVersion: form.version,
          current,
        },
      };

    const requested = listOnboardingClarificationBlocks(
      current.blocks,
      OnboardingClarificationMode.Customer,
    );
    if (requested.length === 0)
      return { ok: false, code: OnboardingErrorCode.ReviewIncomplete };

    const [project] = await tx
      .select({ title: projects.title })
      .from(projects)
      .where(eq(projects.id, form.project_id))
      .limit(1);
    if (!project) throw new Error("Onboarding form without its project");

    const changed = await onboardingFormTransitionService.requestChanges(
      tx,
      form,
      {
        actor: { type: ActorType.User, userId: actor.userId },
        memberId: actor.workspaceMemberId,
        projectTitle: project.title,
        // One chat notice serves every contact, so the titles come in the default language.
        requested: requested.map((step) => ({
          blockId: step.block.id,
          title:
            resolveQuestionnaireText(step.block.translations, DEFAULT_LOCALE)
              ?.text.title ?? step.block.key,
          note: step.reviewNote ?? "",
        })),
      },
    );
    return { ok: true, value: await toDto(changed) };
  });
}
