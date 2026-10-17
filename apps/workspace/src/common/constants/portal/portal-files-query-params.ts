/** URL state of the portal files page: the open tab, the ZIP selection, the project scope and the shown file. */
export const PortalFilesQueryParam = {
  Tab: "tab",
  Selected: "selected",
  Scope: "scope",
  File: "file",
} as const;

export type PortalFilesQueryParam =
  (typeof PortalFilesQueryParam)[keyof typeof PortalFilesQueryParam];

/** Whether the page lists the selected project's files or those of every project. */
export const PortalFilesScope = {
  Project: "project",
  All: "all",
} as const;

export type PortalFilesScope =
  (typeof PortalFilesScope)[keyof typeof PortalFilesScope];

/** From this width the page shows the chosen file next to the list; CSS repeats the breakpoint. */
export const PORTAL_FILES_PANEL_MEDIA_QUERY = "(min-width: 1100px)";
