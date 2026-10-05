/**
 * Dialog state of the block editor in the URL. The names carry an `questionnaire` prefix because the
 * editor is embedded in other pages (Task 65) next to their own params.
 */
export const QuestionnaireEditorQueryParam = {
  Field: "questionnaireField",
  Parent: "questionnaireParent",
  DeleteField: "questionnaireDeleteField",
  Dialog: "questionnaireDialog",
  TemplateBlock: "questionnaireBlock",
} as const;

export type QuestionnaireEditorQueryParam =
  (typeof QuestionnaireEditorQueryParam)[keyof typeof QuestionnaireEditorQueryParam];

/** `questionnaireField=new` opens the dialog for a new field. */
export const QUESTIONNAIRE_NEW_FIELD_PARAM_VALUE = "new";
