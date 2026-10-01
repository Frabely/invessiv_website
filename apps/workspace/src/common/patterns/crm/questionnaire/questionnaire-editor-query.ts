import {
  QUESTIONNAIRE_NEW_FIELD_PARAM_VALUE,
  QuestionnaireEditorQueryParam,
} from "@/common/constants/crm/questionnaire/questionnaire-editor-query-params";
import { QuestionnaireEditorDialogKind as Kind } from "@/common/constants/crm/questionnaire/questionnaire-editor-dialog-kinds";
import type { QuestionnaireEditorDialog } from "@/common/contracts/crm/questionnaire/questionnaire-editor-dialog";

/** Ids are not checked against the block here; the editor opens nothing for an unknown one. */
export function readQuestionnaireEditorDialog(
  params: URLSearchParams,
): QuestionnaireEditorDialog {
  const deleteId = params.get(QuestionnaireEditorQueryParam.DeleteField);
  if (deleteId) return { kind: Kind.DeleteField, fieldId: deleteId };
  const field = params.get(QuestionnaireEditorQueryParam.Field);
  if (!field) return null;
  if (field === QUESTIONNAIRE_NEW_FIELD_PARAM_VALUE)
    return {
      kind: Kind.CreateField,
      parentFieldId: params.get(QuestionnaireEditorQueryParam.Parent) || null,
    };
  return { kind: Kind.EditField, fieldId: field };
}

/** Replaces only the editor's own params and keeps every other param of the page. */
export function writeQuestionnaireEditorDialog(
  params: URLSearchParams,
  dialog: QuestionnaireEditorDialog,
): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete(QuestionnaireEditorQueryParam.Field);
  next.delete(QuestionnaireEditorQueryParam.Parent);
  next.delete(QuestionnaireEditorQueryParam.DeleteField);
  if (dialog?.kind === Kind.CreateField) {
    next.set(
      QuestionnaireEditorQueryParam.Field,
      QUESTIONNAIRE_NEW_FIELD_PARAM_VALUE,
    );
    if (dialog.parentFieldId)
      next.set(QuestionnaireEditorQueryParam.Parent, dialog.parentFieldId);
  }
  if (dialog?.kind === Kind.EditField)
    next.set(QuestionnaireEditorQueryParam.Field, dialog.fieldId);
  if (dialog?.kind === Kind.DeleteField)
    next.set(QuestionnaireEditorQueryParam.DeleteField, dialog.fieldId);
  return next;
}
