"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { faListUl, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  findQuestionnaireField,
  flattenQuestionnaireFields,
  questionnaireFieldLevel,
} from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, ConfirmDialog, EmptyState } from "@invessiv/ui";
import { VersionedMutationOutcomeKind } from "@/common/constants/client/versioned-mutation-outcome-kinds";
import { QuestionnaireEditorDialogKind } from "@/common/constants/crm/questionnaire/questionnaire-editor-dialog-kinds";
import type { VersionedMutationOutcome } from "@/common/contracts/client/versioned-mutation-outcome";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import type { QuestionnaireFieldDeleteDialog } from "@/common/contracts/crm/questionnaire/questionnaire-field-delete-dialog";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import { questionnaireFieldName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import { useVersionedCommand } from "@/hooks/workspace/use-versioned-command";
import { useQuestionnaireEditorDialog } from "@/hooks/workspace/crm/use-questionnaire-editor-dialog";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireBlockHeadForm } from "../questionnaire-block-head-form/questionnaire-block-head-form";
import { QuestionnaireFieldDialog } from "../questionnaire-field-dialog/questionnaire-field-dialog";
import { QuestionnaireFieldList } from "../questionnaire-field-list/questionnaire-field-list";
import styles from "./questionnaire-block-editor.module.css";

export type QuestionnaireBlockEditorProps = {
  /** The owner's writes; the editor itself knows neither the catalog nor forms. */
  api: QuestionnaireDefinitionClientApi;
  block: QuestionnaireBlockDto;
  canWrite: boolean;
  content: CrmQuestionnaireDictionary;
  fixedChoiceLabels: QuestionnaireFixedChoiceLabels;
  locale: Locale;
  /** Called after every accepted write, e.g. to refresh counts outside the editor. */
  onBlockChangeAction?: (block: QuestionnaireBlockDto) => void;
  /**
   * Replaces the delete confirmation. An owner whose fields carry answers says there what is
   * lost; the catalog keeps the editor's own dialog.
   */
  renderDeleteDialogAction?: (
    dialog: QuestionnaireFieldDeleteDialog,
  ) => ReactNode;
  showStatus: boolean;
};

/**
 * Edits one block: its head and its fields. Every write answers with the whole block, which
 * replaces the local one; a conflict adopts the current block and keeps the dialog's input.
 */
export function QuestionnaireBlockEditor({
  api,
  block: initialBlock,
  canWrite,
  content,
  fixedChoiceLabels,
  locale,
  onBlockChangeAction,
  renderDeleteDialogAction,
  showStatus,
}: QuestionnaireBlockEditorProps) {
  const [block, setBlock] = useState(initialBlock);
  const { busy: listBusy, run } = useVersionedCommand();
  const [listFailure, setListFailure] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const pendingFocusRef = useRef<{ fieldId: string; control: string } | null>(
    null,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const { dialog, open, close } = useQuestionnaireEditorDialog();
  const text = content.editor.fields;
  const fieldCount = flattenQuestionnaireFields(block.fields).length;
  const name = (field: QuestionnaireFieldDto) =>
    questionnaireFieldName(field, locale, text.untitled);

  // Focus follows a moved row, so keyboard users can keep moving it.
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    pendingFocusRef.current = null;
    const row = listRef.current?.querySelector(
      `[data-field-id="${pending.fieldId}"]`,
    );
    const buttons = [
      ...(row?.querySelectorAll<HTMLButtonElement>("button[data-control]") ??
        []),
    ];
    (
      buttons.find(
        (button) =>
          button.dataset.control === pending.control && !button.disabled,
      ) ?? buttons.find((button) => !button.disabled)
    )?.focus();
  });

  function adopt(next: QuestionnaireBlockDto) {
    setBlock(next);
    onBlockChangeAction?.(next);
  }

  /** Shared answer handling of every list action; the dialog keeps its own. */
  function settleListOutcome(
    outcome: VersionedMutationOutcome<
      QuestionnaireBlockDto,
      QuestionnaireErrorCode
    >,
    success: (next: QuestionnaireBlockDto) => void,
  ) {
    switch (outcome.kind) {
      case VersionedMutationOutcomeKind.Saved:
        setListFailure(null);
        adopt(outcome.value);
        success(outcome.value);
        return;
      case VersionedMutationOutcomeKind.Conflict:
        adopt(outcome.current);
        setListFailure(content.editor.conflict);
        return;
      case VersionedMutationOutcomeKind.Failure:
        setListFailure(content.errors[outcome.code]);
    }
  }

  async function move(field: QuestionnaireFieldDto, direction: -1 | 1) {
    const outcome = await run(() =>
      api.moveField(field.id, {
        direction,
        expectedBlockVersion: block.version,
      }),
    );
    settleListOutcome(outcome, (next) => {
      const moved = findQuestionnaireField(next, field.id);
      if (!moved) return;
      setAnnouncement(
        formatMessage(text.moved, {
          name: name(moved),
          position: moved.position + 1,
        }),
      );
      pendingFocusRef.current = {
        fieldId: field.id,
        control: direction === -1 ? "up" : "down",
      };
    });
  }

  async function removeField(field: QuestionnaireFieldDto) {
    const outcome = await run(() =>
      api.deleteField(field.id, { expectedBlockVersion: block.version }),
    );
    close();
    settleListOutcome(outcome, () =>
      setAnnouncement(formatMessage(text.removed, { name: name(field) })),
    );
  }

  /** The field dialog wrote the block; the list follows and says what happened. */
  function handleFieldSaved(
    next: QuestionnaireBlockDto,
    field: QuestionnaireFieldDto | null,
    parentFieldId: string | null,
  ) {
    adopt(next);
    const saved = field
      ? findQuestionnaireField(next, field.id)
      : questionnaireFieldLevel(next, parentFieldId).at(-1);
    if (saved)
      setAnnouncement(
        formatMessage(field ? text.updated : text.added, { name: name(saved) }),
      );
  }

  const editField =
    dialog?.kind === QuestionnaireEditorDialogKind.EditField
      ? findQuestionnaireField(block, dialog.fieldId)
      : undefined;
  const deleteField =
    dialog?.kind === QuestionnaireEditorDialogKind.DeleteField
      ? findQuestionnaireField(block, dialog.fieldId)
      : undefined;
  const createParent =
    dialog?.kind === QuestionnaireEditorDialogKind.CreateField
      ? dialog.parentFieldId
      : null;
  // An unknown parent or field id opens nothing; it is not an error.
  const showCreate =
    canWrite &&
    dialog?.kind === QuestionnaireEditorDialogKind.CreateField &&
    (createParent === null ||
      block.fields.some(
        (field) =>
          field.id === createParent &&
          field.type === QuestionnaireFieldType.Group,
      ));

  return (
    <div className={styles.editor}>
      <QuestionnaireBlockHeadForm
        api={api}
        block={block}
        canWrite={canWrite}
        content={content}
        key={block.id}
        locale={locale}
        onBlockAction={adopt}
        showStatus={showStatus}
      />

      <section
        aria-labelledby="questionnaire-fields-heading"
        className={styles.fields}
      >
        <header className={styles.fieldsHeader}>
          <h2 className={styles.fieldsTitle} id="questionnaire-fields-heading">
            {text.legend}
            <span className={styles.count}>
              {fieldCount === 1
                ? text.countOne
                : formatMessage(text.count, { count: fieldCount })}
            </span>
          </h2>
          {canWrite ? (
            <ButtonControl
              className={styles.addButton}
              disabled={
                listBusy || fieldCount >= QUESTIONNAIRE_LIMITS.fieldsPerBlock
              }
              onClick={() =>
                open({
                  kind: QuestionnaireEditorDialogKind.CreateField,
                  parentFieldId: null,
                })
              }
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
              {text.add}
            </ButtonControl>
          ) : null}
        </header>
        {listFailure ? (
          <p className={styles.failure} role="alert">
            {listFailure}
          </p>
        ) : null}
        <div ref={listRef}>
          {block.fields.length === 0 ? (
            <EmptyState
              alignment="start"
              description={text.empty.description}
              icon={<FontAwesomeIcon icon={faListUl} />}
              title={text.empty.title}
            />
          ) : (
            <QuestionnaireFieldList
              actions={
                canWrite
                  ? {
                      busy: listBusy,
                      onAddChildAction: (group) =>
                        open({
                          kind: QuestionnaireEditorDialogKind.CreateField,
                          parentFieldId: group.id,
                        }),
                      onDeleteAction: (field) =>
                        open({
                          kind: QuestionnaireEditorDialogKind.DeleteField,
                          fieldId: field.id,
                        }),
                      onEditAction: (field) =>
                        open({
                          kind: QuestionnaireEditorDialogKind.EditField,
                          fieldId: field.id,
                        }),
                      onMoveAction: move,
                    }
                  : undefined
              }
              block={block}
              content={content}
              locale={locale}
            />
          )}
        </div>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </section>

      {showCreate || (canWrite && editField) ? (
        <QuestionnaireFieldDialog
          api={api}
          block={block}
          content={content}
          field={editField ?? null}
          fixedChoiceLabels={fixedChoiceLabels}
          key={editField?.id ?? `new-${createParent ?? "block"}`}
          locale={locale}
          onCloseAction={close}
          onConflictAction={adopt}
          onSavedAction={(next) =>
            handleFieldSaved(
              next,
              editField ?? null,
              editField ? editField.parentFieldId : createParent,
            )
          }
          parentFieldId={editField ? editField.parentFieldId : createParent}
        />
      ) : null}

      {canWrite && deleteField && renderDeleteDialogAction
        ? renderDeleteDialogAction({
            field: deleteField,
            name: name(deleteField),
            busy: listBusy,
            onCancelAction: close,
            onConfirmAction: () => void removeField(deleteField),
          })
        : null}
      {canWrite && deleteField && !renderDeleteDialogAction ? (
        <ConfirmDialog
          busy={listBusy}
          cancelLabel={content.editor.deleteDialog.cancel}
          closeLabel={content.catalog.dialog.close}
          confirmLabel={content.editor.deleteDialog.confirm}
          description={formatMessage(
            deleteField.type === QuestionnaireFieldType.Group
              ? content.editor.deleteDialog.descriptionGroup
              : content.editor.deleteDialog.description,
            { name: name(deleteField) },
          )}
          onCancelAction={close}
          onConfirmAction={() => void removeField(deleteField)}
          title={content.editor.deleteDialog.title}
          tone="danger"
        />
      ) : null}
    </div>
  );
}
