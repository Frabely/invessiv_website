export const WidgetOpenMode = {
  Dialog: "dialog",
  Expand: "expand",
  Dock: "dock",
  None: "none",
} as const;

export type WidgetOpenMode =
  (typeof WidgetOpenMode)[keyof typeof WidgetOpenMode];
