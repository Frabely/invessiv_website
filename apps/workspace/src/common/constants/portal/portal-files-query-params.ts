/** URL state of the portal files page: the open tab and the ZIP selection. */
export const PortalFilesQueryParam = {
  Tab: "tab",
  Selected: "selected",
  Scope: "scope",
} as const;

export type PortalFilesQueryParam =
  (typeof PortalFilesQueryParam)[keyof typeof PortalFilesQueryParam];
