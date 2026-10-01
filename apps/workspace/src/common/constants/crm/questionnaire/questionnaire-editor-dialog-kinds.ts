export const QuestionnaireEditorDialogKind = {
  CreateField: "createField",
  EditField: "editField",
  DeleteField: "deleteField",
} as const;

export type QuestionnaireEditorDialogKind =
  (typeof QuestionnaireEditorDialogKind)[keyof typeof QuestionnaireEditorDialogKind];
