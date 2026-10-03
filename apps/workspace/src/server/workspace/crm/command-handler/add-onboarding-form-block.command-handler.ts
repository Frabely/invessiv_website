import "server-only";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { AddOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/add-onboarding-form-block-request.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormCreateService } from "@/server/workspace/crm/services/onboarding/onboarding-form-create-service";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";
import { onboardingReviewService } from "@/server/shared/services/onboarding/onboarding-review-service";
import { onboardingFormStructureService } from "@/server/workspace/crm/services/onboarding/onboarding-form-structure-service";
import { onboardingPrefillService } from "@/server/workspace/crm/services/onboarding/onboarding-prefill-service";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import { questionnaireDefinitionWriteService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-write-service";

/**
 * A new last step of a form: a snapshot copy of an active catalog block, pre-filled like the
 * blocks at the start, or an empty block of its own. Block keys are unique within a form; the
 * check is race-free because every structure write holds the form lock, so the same catalog block
 * cannot be added twice.
 */
export async function addOnboardingFormBlock(
  formId: string,
  input: AddOnboardingFormBlockRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<OnboardingFormDto>> {
  const parsed = onboardingFormSchemas.addBlock.safeParse(input);
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
      const steps = await onboardingReviewService.listSteps(tx, form.id);
      const requestedCatalogIds =
        "catalogBlockIds" in data ? data.catalogBlockIds : null;
      const additions = requestedCatalogIds?.length ?? 1;
      if (steps.length + additions > QUESTIONNAIRE_LIMITS.blocksPerOwner)
        return { ok: false, code: QuestionnaireErrorCode.LimitReached };

      if (requestedCatalogIds) {
        const sources: QuestionnaireBlockDto[] = [];
        const sourceKeys = new Set<string>();
        for (const catalogBlockId of requestedCatalogIds) {
          const source = await questionnaireDefinitionReadService.findBlock(
            tx,
            catalogBlockId,
            null,
          );
          if (!source || source.status !== QuestionnaireCatalogStatus.Active)
            return { ok: false, code: QuestionnaireErrorCode.BlockNotFound };
          if (sourceKeys.has(source.key))
            return { ok: false, code: QuestionnaireErrorCode.KeyTaken };
          sourceKeys.add(source.key);
          if (
            await questionnaireDefinitionReadService.isBlockKeyTaken(
              tx,
              form.id,
              source.key,
            )
          )
            return { ok: false, code: QuestionnaireErrorCode.KeyTaken };
          sources.push(source);
        }

        const blockIds: string[] = [];
        for (const [index, source] of sources.entries())
          blockIds.push(
            await onboardingFormCreateService.appendCatalogBlock(
              tx,
              form.id,
              source,
              steps.length + index,
            ),
          );
        await onboardingPrefillService.prefillBlocks(tx, {
          form,
          blockIds,
          actor,
        });
        return null;
      }

      if (!("key" in data))
        return { ok: false, code: QuestionnaireErrorCode.BlockNotFound };
      const created = await questionnaireDefinitionWriteService.createBlock(
        tx,
        form.id,
        { key: data.key, carryOver: false, translations: data.translations },
      );
      if (!created.ok) {
        if ("conflict" in created)
          throw new Error("Creating a block cannot conflict with a version");
        return created;
      }
      await onboardingFormCreateService.appendStep(
        tx,
        form.id,
        created.value.id,
        steps.length,
      );
      return null;
    },
  );
}
