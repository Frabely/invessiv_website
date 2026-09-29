import type { UploadSide } from "@invessiv/common/constants/files/upload-side";
import type { files } from "@invessiv/db/record-configuration";

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
