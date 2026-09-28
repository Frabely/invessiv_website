import type { AssetKind } from "../../constants/files/asset-kind";
import type { FileSource } from "../../constants/files/file-source";
import type { FileStatus } from "../../constants/files/file-status";
import type { UploadSide } from "../../constants/files/upload-side";
import type { UploadExtension } from "../../constants/files/upload-extension";
import type { FileInspectionStatus } from "../../constants/files/file-inspection-status";

/** Public metadata only; storage coordinates and signed capabilities never belong here. */
export interface FileDto {
  /** Stable identifier used by mutation and download endpoints. */
  id: string;
  /** Customer owning this entry, including project entries. */
  customerId: string;
  /** Null means customer-wide. */
  projectId: string | null;
  /** Determines whether content is stored or linked. */
  source: FileSource;
  /** Pending entries are returned only to the uploader, never by lists. */
  status: FileStatus;
  /** Preview and filtering category. */
  assetKind: AssetKind;
  /** Original filename or user-provided link label. */
  displayName: string;
  /** Optional plain-text annotation. */
  note: string | null;
  /** Portal eligibility; customer uploads must remain visible. */
  visibleToCustomer: boolean;
  /** Immutable origin, independent of visibility. */
  uploadedBySide: UploadSide;
  /** Internal uploader identifier; null for portal uploads. */
  uploadedByMemberId: string | null;
  /** Portal uploader identifier; null for internal uploads. */
  uploadedByPortalMembershipId: string | null;
  /** Server-normalized media type; null for links. */
  contentType: string | null;
  /** Validated extension; null for links. */
  extension: UploadExtension | null;
  /** Expected or verified byte size; null for links. */
  sizeBytes: number | null;
  /** Unscanned is a format check, never a malware safety claim; null for links. */
  inspectionStatus: FileInspectionStatus | null;
  /** User-provided HTTPS destination for links, never a signed storage URL. */
  url: string | null;
  /** Optimistic concurrency token for edits and deletion. */
  version: number;
  /** ISO timestamp for stable chronological display. */
  createdAt: string;
  /** ISO timestamp of the most recent write. */
  updatedAt: string;
}
