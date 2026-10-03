"use client";

import { type ReactNode, useRef } from "react";
import { faListUl, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  findQuestionnaireField,
  flattenQuestionnaireFields,
} from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, ConfirmDialog, EmptyState } from "@invessiv/ui";
import { QuestionnaireEditorDialogKind } from "@/common/constants/crm/questionnaire/questionnaire-editor-dialog-kinds";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import type { QuestionnaireFieldDeleteDialog } from "@/common/contracts/crm/questionnaire/questionnaire-field-delete-dialog";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import { useQuestionnaireBlockCommands } from "@/hooks/workspace/crm/use-questionnaire-block-commands";
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
  const listRef = useRef<HTMLDivElement>(null);
  const { dialog, open, close } = useQuestionnaireEditorDialog();
  const {
    adopt,
    announcement,
    block,
    busy: listBusy,
    failure: listFailure,
    handleFieldSaved,
    move,
    name,
    removeField,
  } = useQuestionnaireBlockCommands({
    api,
    initialBlock,
    content,
    locale,
    listRef,
    onBlockChangeAction,
    onDeleteAnsweredAction: close,
  });
  const text = content.editor.fields;
  const fieldCount = flattenQuestionnaireFields(block.fields).length;

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
