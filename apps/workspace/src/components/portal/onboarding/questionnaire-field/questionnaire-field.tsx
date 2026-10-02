"use client";

import React, { useEffect } from "react";
import { QUESTIONNAIRE_CONFIRMED_VALUE } from "@invessiv/common/constants/crm/questionnaire/questionnaire-confirmed-value";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireValueErrorCode } from "@invessiv/common/constants/crm/questionnaire/questionnaire-value-error-codes";
import type { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireAnswerFileRefDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file-ref.dto";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireCompletenessInput } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-completeness-input";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalOnboardingServiceDto } from "@invessiv/common/contracts/portal/portal-onboarding-service.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import { isQuestionnaireFieldVisible } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { OnboardingAnswerDrafts } from "@/common/contracts/portal/onboarding-answer-drafts";
import { onboardingAnswerDrafts } from "@/common/patterns/portal/onboarding-answer-drafts";
import { onboardingFieldDomId } from "@/common/patterns/portal/onboarding-field-dom-id";
import type { Locale } from "@/config/i18n";
import type {
  PortalFilesDictionary,
  PortalOnboardingDictionary,
} from "@/i18n/dictionaries/portal";
import { OnboardingChoiceField } from "../fields/onboarding-choice-field/onboarding-choice-field";
import { OnboardingColorField } from "../fields/onboarding-color-field/onboarding-color-field";
import { OnboardingConfirmationField } from "../fields/onboarding-confirmation-field/onboarding-confirmation-field";
import { OnboardingFilesField } from "../fields/onboarding-files-field/onboarding-files-field";
import { OnboardingGroupField } from "../fields/onboarding-group-field/onboarding-group-field";
import { OnboardingMultiChoiceField } from "../fields/onboarding-multi-choice-field/onboarding-multi-choice-field";
import { OnboardingProjectServicesField } from "../fields/onboarding-project-services-field/onboarding-project-services-field";
import { OnboardingScaleField } from "../fields/onboarding-scale-field/onboarding-scale-field";
import { OnboardingTextField } from "../fields/onboarding-text-field/onboarding-text-field";

type Slot = { fieldId: string; groupEntryId: string | null };

export type QuestionnaireFieldProps = {
  field: QuestionnaireResolvedField;
  /** Everything a field reads from and writes to the form it sits in; the same for every field. */
  form: {
    /** Attached files of the whole form; a files field shows those of its own slot. */
    answerFiles: readonly QuestionnaireAnswerFileDto[];
    /** Where files hang that the contact may not open; a read-only block says so. */
    hiddenAnswerFiles: readonly QuestionnaireAnswerFileRefDto[];
    /** True while a group, file or services command is on its way. */
    busy: boolean;
    canAttach: boolean;
    canUpload: boolean;
    content: PortalOnboardingDictionary;
    customerId: string;
    /** Typed text and selections by slot key. */
    drafts: OnboardingAnswerDrafts;
    /** Why the last command of a group failed, by field id. */
    errors: ReadonlyMap<string, PortalOnboardingErrorCode>;
    filesContent: PortalFilesDictionary;
    /** The live state of the whole form; conditions are evaluated against it. */
    input: QuestionnaireCompletenessInput;
    /** Slots whose text cannot be saved, by slot key. */
    invalid: ReadonlyMap<string, QuestionnaireValueErrorCode>;
    locale: Locale;
    onAddEntryAction: (fieldId: string) => string;
    onAnnounceAction: (message: string) => void;
    onAttachFileAction: (
      slot: Slot,
      file: PortalFileDto,
    ) => Promise<PortalOnboardingResult<QuestionnaireAnswerFileDto>>;
    onChangeAction: (
      slotKey: string,
      entries: readonly string[],
      options?: { immediate?: boolean },
    ) => void;
    onCommitAction: (slotKey: string) => void;
    onConfirmServicesAction: (note: string | null) => Promise<boolean>;
    /** The customer chose to leave a remark on the services but has not written it yet. */
    onOpenServicesRemarkAction: () => void;
    servicesRemarkOpen: boolean;
    onDetachFileAction: (
      link: QuestionnaireAnswerFileDto,
    ) => Promise<PortalOnboardingResult<unknown>>;
    onMoveEntryAction: (
      entry: QuestionnaireGroupEntryDto,
      direction: -1 | 1,
    ) => void;
    onRemoveEntryAction: (entry: QuestionnaireGroupEntryDto) => void;
    /** A slot started or finished uploading; the form holds its submission meanwhile. */
    onUploadActivityAction: (slotKey: string, active: boolean) => void;
    projectId: string;
    services: readonly PortalOnboardingServiceDto[];
    servicesError: PortalOnboardingErrorCode | null;
    servicesNote: string | null;
  };
  /** Entry a sub-field is answered for; null on block level. */
  groupEntryId: string | null;
};

/**
 * Picks the control for a field type. Rendering a type is code, so a type this form does not
 * know shows nothing instead of a broken input; development builds say so in the console. A group
 * renders its sub-fields through this same component, one level deep.
 */
export function QuestionnaireField({
  field,
  form,
  groupEntryId,
}: QuestionnaireFieldProps) {
  const slot = { fieldId: field.id, groupEntryId };
  const key = onboardingAnswerDrafts.slotKey(field.id, groupEntryId);
  const id = onboardingFieldDomId(key);
  const entries = form.drafts.get(key) ?? [];
  const invalid = form.invalid.get(key) ?? null;
  const { content } = form;
  const texts = content.field;
  const errorMessage = invalid ? texts.errors[invalid] : null;
  const change = (next: readonly string[], options?: { immediate?: boolean }) =>
    form.onChangeAction(key, next, options);
  const commit = () => form.onCommitAction(key);
  let control: React.ReactNode = null;

  switch (field.type) {
    case QuestionnaireFieldType.ShortText:
    case QuestionnaireFieldType.LongText:
    case QuestionnaireFieldType.Email:
    case QuestionnaireFieldType.Phone:
    case QuestionnaireFieldType.Url:
      control = (
        <OnboardingTextField
          errorMessage={errorMessage}
          field={field}
          id={id}
          onChangeAction={(value) => change([value])}
          onCommitAction={commit}
          texts={texts}
          value={entries[0] ?? ""}
        />
      );
      break;
    case QuestionnaireFieldType.Choice:
    case QuestionnaireFieldType.YesNo:
      control = (
        <OnboardingChoiceField
          field={field}
          id={id}
          onChangeAction={(choiceIds) => change(choiceIds, { immediate: true })}
          selected={entries}
          texts={texts}
        />
      );
      break;
    case QuestionnaireFieldType.MultiChoice:
      control = (
        <OnboardingMultiChoiceField
          field={field}
          id={id}
          onChangeAction={(choiceIds) => change(choiceIds, { immediate: true })}
          selected={entries}
          texts={texts}
        />
      );
      break;
    case QuestionnaireFieldType.Confirmation:
      control = (
        <OnboardingConfirmationField
          checked={entries[0] === QUESTIONNAIRE_CONFIRMED_VALUE}
          field={field}
          id={id}
          onChangeAction={(checked) =>
            change(checked ? [QUESTIONNAIRE_CONFIRMED_VALUE] : [], {
              immediate: true,
            })
          }
        />
      );
      break;
    case QuestionnaireFieldType.Color:
      control = (
        <OnboardingColorField
          errorMessage={errorMessage}
          field={field}
          id={id}
          onChangeAction={(value, options) => change([value], options)}
          onCommitAction={commit}
          texts={texts}
          value={entries[0] ?? ""}
        />
      );
      break;
    case QuestionnaireFieldType.Scale:
      control = (
        <OnboardingScaleField
          field={field}
          id={id}
          onChangeAction={(value) =>
            change(value === "" ? [] : [value], { immediate: true })
          }
          texts={texts}
          value={entries[0] ?? ""}
        />
      );
      break;
    case QuestionnaireFieldType.Files:
      control = (
        <OnboardingFilesField
          canAttach={form.canAttach}
          canUpload={form.canUpload}
          content={content}
          customerId={form.customerId}
          field={field}
          filesContent={form.filesContent}
          hiddenCount={
            form.hiddenAnswerFiles.filter(
              (link) =>
                link.fieldId === field.id && link.groupEntryId === groupEntryId,
            ).length
          }
          id={id}
          links={form.answerFiles
            .filter(
              (link) =>
                link.fieldId === field.id && link.groupEntryId === groupEntryId,
            )
            .sort((left, right) => left.position - right.position)}
          locale={form.locale}
          onActivityChangeAction={(active) =>
            form.onUploadActivityAction(key, active)
          }
          onAnnounceAction={form.onAnnounceAction}
          onAttachAction={(file) => form.onAttachFileAction(slot, file)}
          onDetachAction={form.onDetachFileAction}
          projectId={form.projectId}
        />
      );
      break;
    case QuestionnaireFieldType.ProjectServices:
      control = (
        <OnboardingProjectServicesField
          confirmed={form.input.servicesConfirmed}
          errorMessage={
            form.servicesError ? content.errors[form.servicesError] : null
          }
          field={field}
          id={id}
          note={form.servicesNote}
          onRemarkOpenAction={form.onOpenServicesRemarkAction}
          remarkOpen={form.servicesRemarkOpen}
          onConfirmAction={async (note) => {
            const confirmed = await form.onConfirmServicesAction(note);
            if (confirmed)
              form.onAnnounceAction(content.announcements.servicesConfirmed);
            return confirmed;
          }}
          services={form.services}
          texts={texts.services}
        />
      );
      break;
    case QuestionnaireFieldType.Group: {
      const groupEntries = form.input.groupEntries
        .filter((entry) => entry.fieldId === field.id)
        .sort((left, right) => left.position - right.position);
      const error = form.errors.get(field.id);
      control = (
        <OnboardingGroupField
          busy={form.busy}
          entries={groupEntries}
          errorMessage={error ? content.errors[error] : null}
          field={field}
          hasContentAction={(entry) =>
            form.answerFiles.some((link) => link.groupEntryId === entry.id) ||
            [...form.drafts].some(
              ([slotKey, values]) =>
                onboardingAnswerDrafts.parseSlotKey(slotKey).groupEntryId ===
                  entry.id && values.some((value) => value.trim() !== ""),
            )
          }
          id={id}
          onAddAction={() => {
            const entryId = form.onAddEntryAction(field.id);
            form.onAnnounceAction(
              formatMessage(content.announcements.entryAdded, {
                number: groupEntries.length + 1,
              }),
            );
            return entryId;
          }}
          onMoveAction={form.onMoveEntryAction}
          onRemoveAction={form.onRemoveEntryAction}
          renderFieldAction={(child, entry) =>
            isQuestionnaireFieldVisible(child, form.input, entry.id) ? (
              <QuestionnaireField
                field={child}
                form={form}
                groupEntryId={entry.id}
                key={child.id}
              />
            ) : null
          }
          texts={texts.group}
        />
      );
      break;
    }
  }

  const unknown = control === null;
  useEffect(() => {
    if (unknown && process.env.NODE_ENV === "development")
      console.warn(`[onboarding] no control for field type "${field.type}"`);
  }, [field.type, unknown]);

  return control;
}
