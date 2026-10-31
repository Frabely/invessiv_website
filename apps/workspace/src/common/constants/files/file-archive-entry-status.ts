/** What became of one requested archive entry; a manifest reports it instead of the `_*.txt` notes. */
export const FileArchiveEntryStatus = {
  Included: "included",
  Link: "link",
  Timeout: "timeout",
  Unreadable: "unreadable",
} as const;
export type FileArchiveEntryStatus =
  (typeof FileArchiveEntryStatus)[keyof typeof FileArchiveEntryStatus];
