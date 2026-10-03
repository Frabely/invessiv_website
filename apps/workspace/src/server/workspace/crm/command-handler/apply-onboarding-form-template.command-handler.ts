import "server-only";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { ApplyOnboardingFormTemplateRequestDto } from "@invessiv/common/contracts/crm/onboarding/apply-onboarding-form-template-request.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormCreateService } from "@/server/workspace/crm/services/onboarding/onboarding-form-create-service";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";
import { onboardingFormStructureService } from "@/server/workspace/crm/services/onboarding/onboarding-form-structure-service";
import { onboardingPrefillService } from "@/server/workspace/crm/services/onboarding/onboarding-prefill-service";
import { onboardingReviewService } from "@/server/shared/services/onboarding/onboarding-review-service";

/** Applies one active template to a new, empty draft under the form lock. */
export async function applyOnboardingFormTemplate(
  formId: string,
  input: ApplyOnboardingFormTemplateRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<OnboardingFormDto>> {
  const parsed = onboardingFormSchemas.applyTemplate.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: OnboardingErrorCode.ValidationError,
      errors: parsed.error.issues,
    };
  const data = parsed.data;

  return onboardingFormStructureService.runBlockListCommand(
    formId,
    data.expectedFormVersion,
    actor,
    async (tx, form) => {
      if (form.status !== OnboardingFormStatus.Draft)
        return {
          ok: false,
          code: OnboardingErrorCode.TemplateApplyUnavailable,
        };
      if ((await onboardingReviewService.listSteps(tx, form.id)).length > 0)
        return {
          ok: false,
          code: OnboardingErrorCode.TemplateApplyUnavailable,
        };

      const sources = await onboardingFormCreateService.findTemplateBlocks(
        tx,
        data.templateId,
      );
      if (!sources)
        return { ok: false, code: QuestionnaireErrorCode.TemplateNotFound };
      if (
        sources.some(
          (source) => source.status !== QuestionnaireCatalogStatus.Active,
        )
      )
        return { ok: false, code: OnboardingErrorCode.TemplateBlockArchived };
      if (sources.length > QUESTIONNAIRE_LIMITS.blocksPerOwner)
        return { ok: false, code: QuestionnaireErrorCode.LimitReached };

      const blockIds: string[] = [];
      for (const [position, source] of sources.entries())
        blockIds.push(
          await onboardingFormCreateService.appendCatalogBlock(
            tx,
            form.id,
            source,
            position,
          ),
        );
      await onboardingPrefillService.prefillBlocks(tx, {
        form,
        blockIds,
        actor,
      });
      return { formPatch: { source_template_id: data.templateId } };
    },
  );
}
