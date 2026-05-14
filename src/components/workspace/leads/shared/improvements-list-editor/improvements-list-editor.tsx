"use client";

import { useEffect, useRef, useState } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { LeadFieldLimits } from "@/common/constants/leads/forms/lead-field-limits";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { FormField } from "@/components/shared/form/form-field/form-field";

import styles from "./improvements-list-editor.module.css";

export type ImprovementsListEditorContent = {
  title?: string;
  addButton: string;
  addAriaLabel: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  confirmAdd: string;
  confirmEdit: string;
  cancel: string;
  edit: string;
  remove: string;
  emptyState: string;
  validation: {
    required: string;
    tooLong: string;
    tooMany?: string;
  };
};

type ImprovementsListEditorProps = {
  ariaLabelledBy?: string;
  className?: string;
  content: ImprovementsListEditorContent;
  draftInputName?: string;
  maxEntries?: number;
  maxLengthPerEntry?: number;
  onChange: (next: string[]) => void;
  onInteractionAction?: () => void;
  value: string[];
};

const DRAFT_INPUT_DEFAULT_NAME = "improvement_draft";

export function ImprovementsListEditor({
  ariaLabelledBy,
  className,
  content,
  draftInputName = DRAFT_INPUT_DEFAULT_NAME,
  maxEntries,
  maxLengthPerEntry = LeadFieldLimits.ImprovementMaxLength,
  onChange,
  onInteractionAction,
  value,
}: ImprovementsListEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    if (!editorOpen) {
      return;
    }
    window.requestAnimationFrame(() => {
      editorRef.current
        ?.querySelector<HTMLInputElement>(`[name='${draftInputName}']`)
        ?.focus();
    });
  }, [editorOpen, draftInputName]);

  function notifyInteraction() {
    onInteractionAction?.();
  }

  function resetEditor() {
    setEditorOpen(false);
    setEditingIndex(null);
    setDraft("");
    setDraftError(null);
  }

  function openEditor() {
    if (editorOpen && editingIndex === null) {
      resetEditor();
      notifyInteraction();
      return;
    }
    if (
      maxEntries !== undefined &&
      editingIndex === null &&
      value.length >= maxEntries
    ) {
      return;
    }
    setEditorOpen(true);
    setEditingIndex(null);
    setDraft("");
    setDraftError(null);
    notifyInteraction();
  }

  function beginEdit(index: number) {
    setEditorOpen(true);
    setEditingIndex(index);
    setDraft(value[index] ?? "");
    setDraftError(null);
    notifyInteraction();
  }

  function confirmDraft() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraftError(content.validation.required);
      return;
    }
    if (trimmed.length > maxLengthPerEntry) {
      setDraftError(content.validation.tooLong);
      return;
    }

    if (editingIndex === null) {
      if (
        maxEntries !== undefined &&
        value.length >= maxEntries &&
        content.validation.tooMany
      ) {
        setDraftError(content.validation.tooMany);
        return;
      }
      onChange([...value, trimmed]);
    } else {
      const next = value.slice();
      next[editingIndex] = trimmed;
      onChange(next);
    }
    resetEditor();
    notifyInteraction();
  }

  function removeEntry(index: number) {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
    if (editingIndex === index) {
      resetEditor();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex((current) => (current === null ? null : current - 1));
    }
    notifyInteraction();
  }

  const addDisabled =
    !editorOpen && maxEntries !== undefined && value.length >= maxEntries;
  const confirmLabel =
    editingIndex === null ? content.confirmAdd : content.confirmEdit;
  const rootClassName = className
    ? `${styles.editor} ${className}`
    : styles.editor;

  return (
    <section aria-labelledby={ariaLabelledBy} className={rootClassName}>
      <div className={styles.header}>
        {content.title ? (
          <h3 className={styles.title} id={ariaLabelledBy}>
            {content.title}
          </h3>
        ) : (
          <span aria-hidden="true" />
        )}
        <button
          aria-label={content.addAriaLabel}
          aria-pressed={editorOpen}
          className={styles.iconToggleButton}
          disabled={addDisabled}
          onClick={openEditor}
          title={content.addButton}
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
                name: draftInputName,
                maxLength: maxLengthPerEntry,
                onChange: (event) => {
                  setDraft(event.currentTarget.value);
                  setDraftError(null);
                  notifyInteraction();
                },
                placeholder: content.fieldPlaceholder,
                value: draft,
              }}
              kind="text"
              label={content.fieldLabel}
            />
            <ButtonControl onClick={resetEditor} type="button" variant="ghost">
              {content.cancel}
            </ButtonControl>
            <PrimaryCtaButton onClick={confirmDraft} type="button">
              {confirmLabel}
            </PrimaryCtaButton>
          </div>
        </div>
      ) : null}

      {value.length === 0 ? (
        <p className={styles.emptyState}>{content.emptyState}</p>
      ) : (
        <div className={styles.stack}>
          {value.map((entry, index) => (
            <div className={styles.row} key={`${index}-${entry}`}>
              <span className={styles.entryText}>{entry}</span>
              <div className={styles.rowActions}>
                <ButtonControl
                  onClick={() => beginEdit(index)}
                  type="button"
                  variant="ghost"
                >
                  {content.edit}
                </ButtonControl>
                <ButtonControl
                  onClick={() => removeEntry(index)}
                  type="button"
                  variant="ghost"
                >
                  {content.remove}
                </ButtonControl>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
