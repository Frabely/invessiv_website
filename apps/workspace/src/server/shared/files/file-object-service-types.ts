import type { UploadSide } from "@invessiv/common/constants/files/upload-side";
import type { files } from "@invessiv/db/record-configuration";
import type { FileArchiveEntryStatus } from "@/common/constants/files/file-archive-entry-status";

export type FileRow = typeof files.$inferSelect;

/** Exactly one uploader column is set, matching the side; the table enforces the same rule. */
export type FileUploader =
  | {
      side: typeof UploadSide.Internal;
      memberId: string;
      portalMembershipId: null;
    }
  | {
      side: typeof UploadSide.Customer;
      memberId: null;
      portalMembershipId: string;
    };

/** The columns an archive reads; the query that selects them is the caller's authorization. */
export type ArchiveRow = {
  id: string;
  assetKind: FileRow["asset_kind"];
  displayName: string;
  storageKey: string | null;
  sizeBytes: number | null;
  url: string | null;
};

/** One file to stream; `folder` places it below that archive path instead of the root. */
export type ArchiveEntry = Pick<
  ArchiveRow,
  "displayName" | "storageKey" | "url"
> & {
  folder?: string;
};

/** What became of one entry, in the order the entries were given. */
export type ArchiveEntryOutcome = {
  /** Path inside the archive; for a link the name it would have had. */
  path: string;
  status: FileArchiveEntryStatus;
};

/**
 * A text file written after every entry, so it can report what actually made it in. It replaces
 * the `_LINKS.txt` and `_FEHLENDE-DATEIEN.txt` notes.
 */
export type ArchiveManifest = {
  name: string;
  build: (outcomes: readonly ArchiveEntryOutcome[]) => string;
};

/** A fixed text file at the archive root, written after the entries. */
export type ArchiveText = {
  name: string;
  content: string;
};

export type ArchiveStreamOptions = {
  now?: () => number;
  /** Absolute file-reading deadline; callers can include authentication and preparation time. */
  deadlineAt?: number;
  manifest?: ArchiveManifest;
  texts?: readonly ArchiveText[];
};

export type FileDownload = {
  stream: ReadableStream<Uint8Array>;
  filename: string;
  contentType: string;
};

/** Everything the authorized handler decided before the pending row is written. */
export type PendingUploadInput = {
  customerId: string;
  projectId: string | null;
  displayName: string;
  sizeBytes: number;
  note: string | null;
  visibleToCustomer: boolean;
  uploader: FileUploader;
};

/** Authorized link data; the caller decides visibility and uploader identity. */
export type FileLinkInput = {
  customerId: string;
  projectId: string | null;
  displayName: string;
  note: string | null;
  url: string;
  visibleToCustomer: boolean;
  uploader: FileUploader;
};
