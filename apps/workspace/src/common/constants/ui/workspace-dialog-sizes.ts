export const WorkspaceDialogSize = {
  Narrow: "narrow",
  Wide: "wide",
} as const;

export type WorkspaceDialogSize =
  (typeof WorkspaceDialogSize)[keyof typeof WorkspaceDialogSize];
