/** Visual variants shared by links and button controls. */
export const ButtonVariant = {
  Primary: "primary",
  Ghost: "ghost",
  Quiet: "quiet",
  /** Full-width list action with leading content, a flexible body and trailing content. */
  Row: "row",
} as const;

export type ButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];
