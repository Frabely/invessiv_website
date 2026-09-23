/** Field-level codes of the task form; the dialog maps each one to a message. */
export const TaskFormValidationCode = {
  TitleRequired: "TITLE_REQUIRED",
  DueOnInvalid: "DUE_ON_INVALID",
} as const;

export type TaskFormValidationCode =
  (typeof TaskFormValidationCode)[keyof typeof TaskFormValidationCode];
