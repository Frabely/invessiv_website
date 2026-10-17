export const PortalFilesOverlayKind = {
  Add: "add",
  Preview: "preview",
} as const;

export type PortalFilesOverlayKind =
  (typeof PortalFilesOverlayKind)[keyof typeof PortalFilesOverlayKind];
