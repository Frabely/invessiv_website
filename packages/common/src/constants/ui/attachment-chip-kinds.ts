/** What a message attachment chip does: nothing, remove from the composer, download or open a link. */
export const AttachmentChipKind = {
  Static: "static",
  Removable: "removable",
  Download: "download",
  Link: "link",
} as const;

export type AttachmentChipKind =
  (typeof AttachmentChipKind)[keyof typeof AttachmentChipKind];
