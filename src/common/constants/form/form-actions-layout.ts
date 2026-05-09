export const FormActionsLayout = {
  Inline: "inline",
  Stacked: "stacked",
} as const;

export type FormActionsLayout =
  (typeof FormActionsLayout)[keyof typeof FormActionsLayout];
