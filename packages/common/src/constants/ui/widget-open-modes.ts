export const WidgetOpenMode = {
  Dialog: "dialog",
  Expand: "expand",
  Dock: "dock",
  /** Navigates to another page; the open action is a link. */
  Page: "page",
  None: "none",
} as const;

export type WidgetOpenMode =
  (typeof WidgetOpenMode)[keyof typeof WidgetOpenMode];
