"use client";

import {
  type Control,
  Controller,
  type UseFormClearErrors,
} from "react-hook-form";

import { LeadFieldLimits } from "@invessiv/common/constants/leads/forms/lead-field-limits";
import type { ImprovementsListEditorContent } from "@invessiv/common/contracts/leads";
import { ImprovementsListEditor } from "@/components/workspace/leads/shared/improvements-list-editor/improvements-list-editor";
import type { LeadFormValues } from "@invessiv/common/contracts/leads/forms/lead-form-values";
import type { LeadsFormDictionary } from "@/i18n/dictionaries/workspace/leads";

type ImprovementsSectionProps = {
  clearErrorsAction: UseFormClearErrors<LeadFormValues>;
  content: LeadsFormDictionary;
  control: Control<LeadFormValues>;
  initialItemCount: number;
  isEditMode: boolean;
  onInteractionAction: () => void;
};

const ImprovementsSectionField = {
  Improvements: "improvements",
} as const;

function buildEditorContent(
  content: LeadsFormDictionary,
  isEditMode: boolean,
  initialItemCount: number,
): ImprovementsListEditorContent {
  const emptyState =
    isEditMode && initialItemCount > 0
      ? content.help.improvementsClearedState
      : content.help.improvementsEmptyState;

  return {
    title: content.sections.improvements,
    addButton: content.buttons.addImprovement,
    addAriaLabel: content.buttons.addImprovement,
    fieldLabel: content.fields.improvement,
    fieldPlaceholder: content.placeholders.improvement,
    confirmAdd: content.buttons.confirmAdd,
    confirmEdit: content.buttons.confirmEdit,
    cancel: content.buttons.cancel,
    edit: content.buttons.edit,
    remove: content.buttons.remove,
    emptyState,
    validation: {
      required: content.validation.improvementRequired,
      tooLong: content.validation.improvementTooLong,
    },
  };
}

export function ImprovementsSection({
  clearErrorsAction,
  content,
  control,
  initialItemCount,
  isEditMode,
  onInteractionAction,
}: ImprovementsSectionProps) {
  const editorContent = buildEditorContent(
    content,
    isEditMode,
    initialItemCount,
  );

  return (
    <Controller
      control={control}
      name={ImprovementsSectionField.Improvements}
      render={({ field }) => {
        const values = (field.value ?? []).map((item) => item.value);
        return (
          <ImprovementsListEditor
            ariaLabelledBy="add-lead-improvements"
            content={editorContent}
            maxLengthPerEntry={LeadFieldLimits.ImprovementMaxLength}
            onChangeAction={(next) => {
              field.onChange(next.map((value) => ({ value })));
              clearErrorsAction(ImprovementsSectionField.Improvements);
            }}
            onInteractionAction={onInteractionAction}
            value={values}
          />
        );
      }}
    />
  );
}
