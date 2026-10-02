"use client";

import { useId } from "react";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import { uploadAcceptForKinds } from "@invessiv/common/patterns/files/upload-accept-for-kinds";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormFieldLabel } from "@invessiv/ui";
import { portalFilesApiService } from "@/client/portal/portal-files-api-service";
import { PortalAttachmentField } from "@/components/portal/shared/portal-attachment-field/portal-attachment-field";
import type { Locale } from "@/config/i18n";
import type {
  PortalFilesDictionary,
  PortalOnboardingDictionary,
} from "@/i18n/dictionaries/portal";
import styles from "./onboarding-files-field.module.css";

export type OnboardingFilesFieldProps = {
  /** May attach and detach, which needs `portal.files.read`; without it the files are only listed. */
  canAttach: boolean;
  /** May upload as well, which needs `portal.files.write` on top. */
  canUpload: boolean;
  content: PortalOnboardingDictionary;
  customerId: string;
  field: QuestionnaireResolvedField;
  filesContent: PortalFilesDictionary;
  /** DOM id of the field frame; a jump to this field focuses it. */
  id: string;
  /** The file links of this slot in display order. */
  links: readonly QuestionnaireAnswerFileDto[];
  locale: Locale;
  onActivityChangeAction: (active: boolean) => void;
  onAnnounceAction: (message: string) => void;
  onAttachAction: (
    file: PortalFileDto,
  ) => Promise<PortalOnboardingResult<QuestionnaireAnswerFileDto>>;
  onDetachAction: (
    link: QuestionnaireAnswerFileDto,
  ) => Promise<PortalOnboardingResult<unknown>>;
  /** Uploads land in the form's project, the only place a file may be attached from. */
  projectId: string;
};

/**
 * Files of one field: uploaded through the portal upload into the form's project, then hung on
 * the field. Detaching goes by the link, so a file taken over from an earlier form can leave the
 * field although it belongs to another project.
 */
export function OnboardingFilesField({
  canAttach,
  canUpload,
  content,
  customerId,
  field,
  filesContent,
  id,
  links,
  locale,
  onActivityChangeAction,
  onAnnounceAction,
  onAttachAction,
  onDetachAction,
  projectId,
}: OnboardingFilesFieldProps) {
  const labelId = useId();
  const helpId = useId();
  const texts = content.field.files;
  const named = { field: field.label };

  return (
    <div
      aria-describedby={field.help ? helpId : undefined}
      aria-labelledby={labelId}
      className={styles.field}
      id={id}
      role="group"
      tabIndex={-1}
    >
      <span className={styles.label} id={labelId}>
        <FormFieldLabel
          label={field.label}
          required={
            field.requirement === QuestionnaireFieldRequirement.Required
          }
        />
      </span>
      {field.help ? (
        <p className={styles.help} id={helpId}>
          {field.help}
        </p>
      ) : null}
      <PortalAttachmentField
        accept={uploadAcceptForKinds(field.acceptedAssetKinds)}
        attachAction={async (file) => {
          const result = await onAttachAction(file);
          return result.ok
            ? { ok: true, attachment: result.value.file }
            : { ok: false, message: content.errors[result.code] };
        }}
        attachments={links.map((link) => link.file)}
        canAttach={canAttach}
        canUpload={canUpload}
        customerId={customerId}
        detachAction={async (file) => {
          const link = links.find((entry) => entry.file.id === file.id);
          if (!link) return { ok: true };
          const result = await onDetachAction(link);
          return result.ok
            ? { ok: true }
            : { ok: false, message: content.errors[result.code] };
        }}
        filesContent={filesContent}
        locale={locale}
        maxFiles={field.maxItems ?? QUESTIONNAIRE_LIMITS.filesPerField}
        onActivityChangeAction={onActivityChangeAction}
        onAttachedAction={(file) =>
          onAnnounceAction(
            formatMessage(content.announcements.attached, {
              name: file.displayName,
            }),
          )
        }
        onDetachedAction={(file) =>
          onAnnounceAction(
            formatMessage(content.announcements.detached, {
              name: file.displayName,
            }),
          )
        }
        texts={{
          listLabel: formatMessage(texts.listLabel, named),
          queueLabel: formatMessage(texts.queueLabel, named),
          dropLabel: texts.dropLabel,
          dropHint: texts.dropHint,
          detach: texts.detach,
          detachTitle: texts.detachTitle,
        }}
        transport={portalFilesApiService.uploadTransport(customerId, {
          projectId,
          note: null,
        })}
      />
      {field.minItems !== null && field.minItems > 1 ? (
        <p className={styles.note}>
          {formatMessage(
            links.length >= field.minItems
              ? texts.minimumReached
              : texts.minimum,
            { min: field.minItems, count: links.length },
          )}
        </p>
      ) : null}
      {field.maxItems !== null ? (
        <p className={styles.note}>
          {formatMessage(texts.limit, { max: field.maxItems })}
        </p>
      ) : null}
      {canAttach && !canUpload ? (
        <p className={styles.note}>{texts.noUpload}</p>
      ) : null}
    </div>
  );
}
