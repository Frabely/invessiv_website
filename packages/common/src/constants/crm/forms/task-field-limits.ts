/** Mirrors the `tasks` columns: the form and the server schema bound the fields identically. */
export const TaskFieldLimits = {
  TitleMaxLength: 200,
  DescriptionMaxLength: 4000,
} as const;

export type TaskFieldLimit =
  (typeof TaskFieldLimits)[keyof typeof TaskFieldLimits];
