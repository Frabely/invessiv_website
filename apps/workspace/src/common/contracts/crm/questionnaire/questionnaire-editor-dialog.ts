import type { QuestionnaireEditorDialogKind } from "@/common/constants/crm/questionnaire/questionnaire-editor-dialog-kinds";

/** Which dialog of the block editor the URL opens; null means none. */
export type QuestionnaireEditorDialog =
  | {
      kind: typeof QuestionnaireEditorDialogKind.CreateField;
      parentFieldId: string | null;
    }
  | { kind: typeof QuestionnaireEditorDialogKind.EditField; fieldId: string }
  | { kind: typeof QuestionnaireEditorDialogKind.DeleteField; fieldId: string }
  | null;
