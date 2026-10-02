import "server-only";

import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { AttachPortalOnboardingFileRequestDto } from "@invessiv/common/contracts/portal/attach-portal-onboarding-file-request.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { portalOnboardingSchemas } from "@/server/portal/services/onboarding/portal-onboarding-schemas";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";
import type { FileRow } from "@/server/shared/files/file-object-service-types";
import { onboardingAttachmentService } from "@/server/shared/services/onboarding/onboarding-attachment-service";
import { onboardingFormMappingService } from "@/server/shared/services/onboarding/onboarding-form-mapping-service";
import type { OnboardingFormRow } from "@/server/shared/services/onboarding/onboarding-form-types";

/**
 * Only a finished own upload or link of the form's project, of a kind the field accepts. A file
 * taken over from an earlier form may belong to another project; it stays where the pre-fill put
 * it but cannot be attached anew.
 */
function isAttachable(
  file: FileRow,
  form: OnboardingFormRow,
  field: QuestionnaireFieldDto,
): boolean {
  return (
    file.uploaded_by_side === UploadSide.Customer &&
    file.status === FileStatus.Ready &&
    file.orphaned_at === null &&
    file.project_id === form.project_id &&
    (field.acceptedAssetKinds === null ||
      field.acceptedAssetKinds.includes(file.asset_kind))
  );
}

/**
 * Hangs an uploaded file onto a files field of a form the customer may edit. A file the contact
 * cannot see answers like a missing one; repeating an attachment is a success. The limit is
 * counted under the form lock, so parallel attachments cannot pass it.
 */
export async function attachPortalOnboardingFile(
  actor: PortalActor,
  formId: string,
  input: AttachPortalOnboardingFileRequestDto,
): Promise<PortalOnboardingResult<QuestionnaireAnswerFileDto>> {
  const parsed = portalOnboardingSchemas.attachFile.safeParse(input);
  if (!parsed.success) return portalOnboardingService.validation();
  if (!portalOnboardingService.canAttach(actor))
    return portalOnboardingService.notFound();
  const { fieldId, groupEntryId, fileId } = parsed.data;

  return portalOnboardingService.withLockedForm(
    actor,
    formId,
    async (tx, { form }) => {
      const slot = { formId: form.id, fieldId, groupEntryId };
      const field = await portalOnboardingService.findWritableField(
        tx,
        actor,
        form,
        slot,
      );
      if (!field.ok) return field;
      if (field.value.type !== QuestionnaireFieldType.Files)
        return portalOnboardingService.validation();

      const file = await portalFileService.lockVisible(tx, actor, fileId);
      if (!file) return portalOnboardingService.notFound();
      const links = await onboardingAttachmentService.listOfSlot(tx, slot);
      const existing = links.find((link) => link.file_id === file.id);
      if (existing)
        return {
          ok: true,
          value: onboardingFormMappingService.toAnswerFileDto({
            link: existing,
            file,
          }),
        };
      if (!isAttachable(file, form, field.value))
        return { ok: false, code: PortalOnboardingErrorCode.NotAttachable };
      const limit = field.value.maxItems ?? QUESTIONNAIRE_LIMITS.filesPerField;
      if (links.length >= limit)
        return { ok: false, code: PortalOnboardingErrorCode.LimitReached };
      return {
        ok: true,
        value: await onboardingAttachmentService.attach(
          tx,
          slot,
          file,
          links.length,
        ),
      };
    },
  );
}
