"use client";

import React, { useEffect } from "react";
import { QUESTIONNAIRE_CONFIRMED_VALUE } from "@invessiv/common/constants/crm/questionnaire/questionnaire-confirmed-value";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { isQuestionnaireFieldVisible } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { OnboardingFieldFormContext } from "@/common/contracts/portal/onboarding-field-form-context";
import type { OnboardingFieldReadContext } from "@/common/contracts/portal/onboarding-field-read-context";
import type { OnboardingReadFiles } from "@/common/contracts/shared/onboarding-read-files";
import { OnboardingReadFilesField } from "../fields/onboarding-read-files-field/onboarding-read-files-field";
import styles from "./questionnaire-field.module.css";
import { getOnboardingAnswerFileSlot } from "@/common/patterns/shared/onboarding-answer-file-slot";
import { onboardingAnswerDrafts } from "@/common/patterns/portal/onboarding-answer-drafts";
import { onboardingFieldDomId } from "@/common/patterns/portal/onboarding-field-dom-id";
import { onboardingFieldSpan } from "@/common/patterns/portal/onboarding-field-span";
import { OnboardingChoiceField } from "../fields/onboarding-choice-field/onboarding-choice-field";
import { OnboardingColorField } from "../fields/onboarding-color-field/onboarding-color-field";
import { OnboardingConfirmationField } from "../fields/onboarding-confirmation-field/onboarding-confirmation-field";
import { OnboardingFilesField } from "../fields/onboarding-files-field/onboarding-files-field";
import { OnboardingGroupField } from "../fields/onboarding-group-field/onboarding-group-field";
import { OnboardingMultiChoiceField } from "../fields/onboarding-multi-choice-field/onboarding-multi-choice-field";
import { OnboardingProjectServicesField } from "../fields/onboarding-project-services-field/onboarding-project-services-field";
import { OnboardingScaleField } from "../fields/onboarding-scale-field/onboarding-scale-field";
import { OnboardingTextField } from "../fields/onboarding-text-field/onboarding-text-field";
import { OnboardingFieldCell } from "../onboarding-field-grid/onboarding-field-grid";

export type QuestionnaireFieldProps = {
  field: QuestionnaireResolvedField;
  /** Display data, shared by editable and locked fields. */
  form: OnboardingFieldReadContext;
  /** Absent in locked blocks and the reader; neither mounts autosave nor exposes commands. */
  editor?: OnboardingFieldFormContext;
  files?: OnboardingReadFiles;
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
  editor,
  files,
  groupEntryId,
}: QuestionnaireFieldProps) {
  const slot = { fieldId: field.id, groupEntryId };
  const key = onboardingAnswerDrafts.slotKey(field.id, groupEntryId);
  const id = onboardingFieldDomId(key);
  const entries = form.drafts.get(key) ?? [];
  const invalid = editor?.invalid.get(key) ?? null;
  const { content } = form;
  const texts = content.field;
  const errorMessage = invalid ? texts.errors[invalid] : null;
  const change = (next: readonly string[], options?: { immediate?: boolean }) =>
    editor?.onChangeAction(key, next, options);
  const commit = () => editor?.onCommitAction(key);
  let control: React.ReactNode = null;

  switch (field.type) {
    case QuestionnaireFieldType.ShortText:
    case QuestionnaireFieldType.LongText:
    case QuestionnaireFieldType.Email:
    case QuestionnaireFieldType.Phone:
    case QuestionnaireFieldType.Url:
      control = (
        <OnboardingTextField
          disabled={!editor}
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
          disabled={!editor}
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
          disabled={!editor}
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
          disabled={!editor}
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
          disabled={!editor}
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
          disabled={!editor}
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
    case QuestionnaireFieldType.Files: {
      const fileSlot = getOnboardingAnswerFileSlot(
        form.answerFiles,
        form.hiddenAnswerFiles,
        slot,
      );
      control = editor ? (
        <OnboardingFilesField
          canAttach={editor.canAttach}
          canUpload={editor.canUpload}
          content={content}
          customerId={editor.customerId}
          field={field}
          filesContent={editor.filesContent}
          hiddenCount={fileSlot.hiddenCount}
          id={id}
          links={fileSlot.links}
          locale={form.locale}
          onActivityChangeAction={(active) =>
            editor.onUploadActivityAction(key, active)
          }
          onAnnounceAction={editor.onAnnounceAction}
          onAttachAction={(file) => editor.onAttachFileAction(slot, file)}
          onDetachAction={editor.onDetachFileAction}
          projectId={editor.projectId}
        />
      ) : (
        <OnboardingReadFilesField
          field={field}
          files={files}
          form={form}
          groupEntryId={groupEntryId}
          id={id}
        />
      );
      break;
    }
    case QuestionnaireFieldType.ProjectServices:
      control = (
        <OnboardingProjectServicesField
          confirmed={form.input.servicesConfirmed}
          errorMessage={
            editor?.servicesError ? content.errors[editor.servicesError] : null
          }
          field={field}
          id={id}
          note={form.servicesNote}
          disabled={!editor}
          onRemarkOpenAction={() => editor?.onOpenServicesRemarkAction()}
          remarkOpen={editor?.servicesRemarkOpen ?? false}
          onConfirmAction={async (note) => {
            const confirmed = await editor?.onConfirmServicesAction(note);
            if (confirmed)
              editor?.onAnnounceAction(content.announcements.servicesConfirmed);
            return confirmed ?? false;
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
      const error = editor?.errors.get(field.id);
      control = (
        <OnboardingGroupField
          busy={editor?.busy ?? false}
          disabled={!editor}
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
            if (!editor) return;
            const entryId = editor.onAddEntryAction(field.id);
            editor.onAnnounceAction(
              formatMessage(content.announcements.entryAdded, {
                number: groupEntries.length + 1,
              }),
            );
            return entryId;
          }}
          onMoveAction={(entry, direction) =>
            editor?.onMoveEntryAction(entry, direction)
          }
          onRemoveAction={(entry) => editor?.onRemoveEntryAction(entry)}
          renderFieldAction={(child, entry) =>
            isQuestionnaireFieldVisible(child, form.input, entry.id) ? (
              <OnboardingFieldCell
                key={child.id}
                span={onboardingFieldSpan(child)}
              >
                <QuestionnaireField
                  field={child}
                  form={form}
                  editor={editor}
                  files={files}
                  groupEntryId={entry.id}
                />
              </OnboardingFieldCell>
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

  // File actions stay available for reading, including files inside a locked group.
  if (
    field.type === QuestionnaireFieldType.Files ||
    field.type === QuestionnaireFieldType.Group ||
    unknown
  )
    return control;
  return (
    <fieldset
      aria-label={field.label}
      className={styles.control}
      disabled={!editor}
    >
      {control}
    </fieldset>
  );
}
