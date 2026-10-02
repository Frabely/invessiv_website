import "server-only";

import { and, eq } from "drizzle-orm";

import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { ConfirmPortalOnboardingServicesRequestDto } from "@invessiv/common/contracts/portal/confirm-portal-onboarding-services-request.dto";
import type { PortalOnboardingAnswerSavedDto } from "@invessiv/common/contracts/portal/portal-onboarding-answer-saved.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  onboardingForms,
  questionnaireBlocks,
  questionnaireFields,
} from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalOnboardingSchemas } from "@/server/portal/services/onboarding/portal-onboarding-schemas";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";

/** The blocks of the form that show the booked services for confirmation. */
async function listServicesBlockIds(
  tx: ContactDatabaseTransaction,
  formId: string,
): Promise<string[]> {
  const rows = await tx
    .select({ blockId: questionnaireFields.block_id })
    .from(questionnaireFields)
    .innerJoin(
      questionnaireBlocks,
      eq(questionnaireBlocks.id, questionnaireFields.block_id),
    )
    .where(
      and(
        eq(questionnaireBlocks.owner_form_id, formId),
        eq(questionnaireFields.type, QuestionnaireFieldType.ProjectServices),
      ),
    );
  return rows.map((row) => row.blockId);
}

/**
 * Confirms the booked services of a form the customer may edit. The confirmation lives on the form
 * head and answers every `project_services` field; it never changes the services themselves. A
 * form without such a field has nothing to confirm.
 */
export async function confirmPortalOnboardingServices(
  actor: PortalActor,
  formId: string,
  input: ConfirmPortalOnboardingServicesRequestDto,
): Promise<PortalOnboardingResult<PortalOnboardingAnswerSavedDto>> {
  const parsed = portalOnboardingSchemas.confirmServices.safeParse(input);
  if (!parsed.success) return portalOnboardingService.validation();

  return portalOnboardingService.withLockedForm(
    actor,
    formId,
    async (tx, { form }) => {
      const editable = await portalOnboardingService.listEditableBlockIds(
        tx,
        actor,
        form,
      );
      if (editable.length === 0)
        return { ok: false, code: PortalOnboardingErrorCode.Locked };
      const servicesBlockIds = await listServicesBlockIds(tx, form.id);
      if (servicesBlockIds.length === 0)
        return portalOnboardingService.validation();
      if (!servicesBlockIds.some((blockId) => editable.includes(blockId)))
        return { ok: false, code: PortalOnboardingErrorCode.Locked };

      await updateLockedVersioned(
        {
          tx,
          table: onboardingForms,
          id: form.id,
          expectedVersion: form.version,
          patch: {
            services_confirmed_at: new Date(),
            services_confirmed_by_portal_membership_id: actor.membershipId,
            services_note: parsed.data.note,
          },
        },
        "Locked onboarding form changed",
      );
      return {
        ok: true,
        value: await portalOnboardingService.toSavedDto(tx, actor),
      };
    },
  );
}
