"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Control,
  useFieldArray,
  type UseFormClearErrors,
} from "react-hook-form";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LeadFieldLimits } from "@/common/constants/leads/lead-field-limits";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { FormField } from "@/components/shared/form/form-field/form-field";
import type { AddLeadFormValues } from "@/common/contracts/leads/forms/add-lead-form-values";
import type { LeadsFormDictionary } from "@/i18n/dictionaries/workspace/leads";
import styles from "./improvements-section.module.css";

type ImprovementsSectionProps = {
  clearErrorsAction: UseFormClearErrors<AddLeadFormValues>;
  content: LeadsFormDictionary;
  control: Control<AddLeadFormValues>;
  onInteractionAction: () => void;
};

const ImprovementsSectionField = {
  Improvements: "improvements",
} as const;

export function ImprovementsSection({
  clearErrorsAction,
  content,
  control,
  onInteractionAction,
}: ImprovementsSectionProps) {
  const improvements = useFieldArray({
    control,
    name: ImprovementsSectionField.Improvements,
  });
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    if (!editorOpen) {
      return;
    }

    window.requestAnimationFrame(() => {
      editorRef.current
        ?.querySelector<HTMLInputElement>("[name='improvement_draft']")
        ?.focus();
    });
  }, [editorOpen]);

  function resetEditor() {
    setEditorOpen(false);
    setDraft("");
    setDraftError(null);
  }

  function openEditor() {
    if (editorOpen) {
      resetEditor();
      onInteractionAction();
      return;
    }

    setEditorOpen(true);
    setDraftError(null);
    onInteractionAction();
  }

  function confirmDraft() {
    const value = draft.trim();
    if (!value) {
      setDraftError(content.validation.improvementRequired);
      return;
    }

    if (value.length > LeadFieldLimits.ImprovementMaxLength) {
      setDraftError(content.validation.improvementTooLong);
      return;
    }

    improvements.append({ value });
    clearErrorsAction(ImprovementsSectionField.Improvements);
    resetEditor();
    onInteractionAction();
  }

  function removeImprovement(index: number) {
    improvements.remove(index);
    clearErrorsAction(ImprovementsSectionField.Improvements);
    onInteractionAction();
  }

  return (
    <section className={styles.section} aria-labelledby="add-lead-improvements">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle} id="add-lead-improvements">
          {content.sections.improvements}
        </h3>
        <button
          aria-label={content.buttons.addImprovement}
          aria-pressed={editorOpen}
          className={styles.iconToggleButton}
          onClick={openEditor}
          title={content.buttons.addImprovement}
          type="button"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      {editorOpen ? (
        <div className={styles.inlineDialog} ref={editorRef}>
          <div className={styles.inlineDialogRow}>
            <FormField
              className={styles.field}
              controlClassName={styles.input}
              errorMessage={draftError ?? undefined}
              inputProps={{
                name: "improvement_draft",
                maxLength: LeadFieldLimits.ImprovementMaxLength,
                onChange: (event) => {
                  setDraft(event.currentTarget.value);
                  setDraftError(null);
                  onInteractionAction();
                },
                placeholder: content.placeholders.improvement,
                value: draft,
              }}
              kind="text"
              label={content.fields.improvement}
            />

            <ButtonControl onClick={resetEditor} type="button" variant="ghost">
              {content.buttons.cancel}
            </ButtonControl>
            <PrimaryCtaButton onClick={confirmDraft} type="button">
              {content.buttons.confirmAdd}
            </PrimaryCtaButton>
          </div>
        </div>
      ) : null}

      <div className={styles.stack}>
        {improvements.fields.map((field, index) => (
          <div className={styles.row} key={field.id}>
            <span className={styles.listItemText}>{field.value}</span>

            <ButtonControl
              onClick={() => removeImprovement(index)}
              type="button"
              variant="ghost"
            >
              {content.buttons.remove}
            </ButtonControl>
          </div>
        ))}
      </div>
    </section>
  );
}
