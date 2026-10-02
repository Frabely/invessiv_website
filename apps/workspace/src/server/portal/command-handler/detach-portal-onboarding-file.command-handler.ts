import "server-only";

import type { PortalOnboardingAnswerSavedDto } from "@invessiv/common/contracts/portal/portal-onboarding-answer-saved.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalOnboardingSchemas } from "@/server/portal/services/onboarding/portal-onboarding-schemas";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";
import { onboardingAttachmentService } from "@/server/shared/services/onboarding/onboarding-attachment-service";

/**
 * Unhooks a file from a files field of a form the customer may edit; the file itself stays under
 * "your uploads". The link decides, not the file: a file taken over from an earlier form can be
 * removed although it belongs to another project.
 */
export async function detachPortalOnboardingFile(
  actor: PortalActor,
  target: { formId: string; answerFileId: string },
): Promise<PortalOnboardingResult<PortalOnboardingAnswerSavedDto>> {
  const linkId = portalOnboardingSchemas.id.safeParse(target.answerFileId);
  if (!linkId.success || !portalOnboardingService.canAttach(actor))
    return portalOnboardingService.notFound();

  return portalOnboardingService.withLockedForm(
    actor,
    target.formId,
    async (tx, { form }) => {
      const link = await onboardingAttachmentService.find(tx, linkId.data);
      if (!link || link.form_id !== form.id)
        return portalOnboardingService.notFound();
      const field = await portalOnboardingService.findWritableField(
        tx,
        actor,
        form,
        {
          formId: form.id,
          fieldId: link.field_id,
          groupEntryId: link.group_entry_id,
        },
      );
      if (!field.ok) return field;
      await onboardingAttachmentService.detach(tx, link);
      return {
        ok: true,
        value: await portalOnboardingService.toSavedDto(tx, actor),
      };
    },
  );
}
