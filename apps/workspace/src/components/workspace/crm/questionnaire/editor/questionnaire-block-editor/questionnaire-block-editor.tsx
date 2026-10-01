"use client";

import { useEffect, useRef, useState } from "react";
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
import { QuestionnaireEditorDialogKind } from "@/common/constants/crm/questionnaire/questionnaire-editor-dialog-kinds";
import type { QuestionnaireClientResult } from "@/common/contracts/crm/questionnaire/questionnaire-client-result";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import type { QuestionnaireFieldFormValues } from "@/common/contracts/crm/questionnaire/questionnaire-field-form-values";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import { questionnaireFieldName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import { toQuestionnaireFieldInput } from "@/common/patterns/crm/questionnaire/questionnaire-field-form";
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
  showStatus: boolean;
};

type DialogState = {
  busy: boolean;
  conflict: boolean;
  failure: QuestionnaireErrorCode | null;
};

const IDLE: DialogState = { busy: false, conflict: false, failure: null };

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
  showStatus,
}: QuestionnaireBlockEditorProps) {
  const [block, setBlock] = useState(initialBlock);
  const [dialogState, setDialogState] = useState<DialogState>(IDLE);
  const [listBusy, setListBusy] = useState(false);
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

  function closeDialog() {
    setDialogState(IDLE);
    close();
  }

  /** Shared answer handling of every list action; the dialog keeps its own. */
  function settleListResult(
    result: QuestionnaireClientResult<QuestionnaireBlockDto>,
    success: (next: QuestionnaireBlockDto) => void,
  ) {
    setListBusy(false);
    if (result.ok) {
      setListFailure(null);
      adopt(result.value);
      success(result.value);
      return;
    }
    if ("current" in result) {
      adopt(result.current);
      setListFailure(content.editor.conflict);
      return;
    }
    setListFailure(content.errors[result.code]);
  }

  async function move(field: QuestionnaireFieldDto, direction: -1 | 1) {
    setListBusy(true);
    const result = await api.moveField(field.id, {
      direction,
      expectedBlockVersion: block.version,
    });
    settleListResult(result, (next) => {
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
    setDialogState({ ...IDLE, busy: true });
    const result = await api.deleteField(field.id, {
      expectedBlockVersion: block.version,
    });
    closeDialog();
    settleListResult(result, () =>
      setAnnouncement(formatMessage(text.removed, { name: name(field) })),
    );
  }

  async function submitField(
    values: QuestionnaireFieldFormValues,
    field: QuestionnaireFieldDto | null,
    parentFieldId: string | null,
  ) {
    setDialogState({ ...IDLE, busy: true });
    const input = toQuestionnaireFieldInput(values);
    const result = field
      ? await api.updateField(field.id, {
          ...input,
          expectedBlockVersion: block.version,
        })
      : await api.createField(block.id, {
          ...input,
          type: values.type,
          parentFieldId,
          expectedBlockVersion: block.version,
        });
    if (result.ok) {
      adopt(result.value);
      const saved = field
        ? findQuestionnaireField(result.value, field.id)
        : questionnaireFieldLevel(result.value, parentFieldId).at(-1);
      if (saved)
        setAnnouncement(
          formatMessage(field ? text.updated : text.added, {
            name: name(saved),
          }),
        );
      closeDialog();
      return;
    }
    if ("current" in result) {
      adopt(result.current);
      setDialogState({ ...IDLE, conflict: true });
      return;
    }
    setDialogState({ ...IDLE, failure: result.code });
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
          block={block}
          busy={dialogState.busy}
          conflict={dialogState.conflict}
          content={content}
          failure={dialogState.failure}
          field={editField ?? null}
          fixedChoiceLabels={fixedChoiceLabels}
          key={editField?.id ?? `new-${createParent ?? "block"}`}
          locale={locale}
          onCloseAction={closeDialog}
          onSubmitAction={(values) =>
            submitField(
              values,
              editField ?? null,
              editField ? editField.parentFieldId : createParent,
            )
          }
          parentFieldId={editField ? editField.parentFieldId : createParent}
        />
      ) : null}

      {canWrite && deleteField ? (
        <ConfirmDialog
          busy={dialogState.busy}
          cancelLabel={content.editor.deleteDialog.cancel}
          closeLabel={content.catalog.dialog.close}
          confirmLabel={content.editor.deleteDialog.confirm}
          description={formatMessage(
            deleteField.type === QuestionnaireFieldType.Group
              ? content.editor.deleteDialog.descriptionGroup
              : content.editor.deleteDialog.description,
            { name: name(deleteField) },
          )}
          onCancelAction={closeDialog}
          onConfirmAction={() => void removeField(deleteField)}
          title={content.editor.deleteDialog.title}
          tone="danger"
        />
      ) : null}
    </div>
  );
}
