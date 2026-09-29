import type { AssetKind } from "../../constants/files/asset-kind";
import type { FileSource } from "../../constants/files/file-source";
import type { UploadExtension } from "../../constants/files/upload-extension";
import type { PortalFileOrigin } from "../../constants/portal/portal-file-origin";

/**
 * A file or link as the customer sees it. Deliberately narrower than `FileDto`: no visibility flag,
 * no uploader identities, no version — the portal never edits and never learns who on the team
 * uploaded something.
 */
export interface PortalFileDto {
  /** Addresses preview, download and ZIP; guessing an internal id answers 404. */
  id: string;
  /** Null means the entry belongs to the company as a whole, shown as "General". */
  projectId: string | null;
  /** Null for company-wide entries and for readers without `portal.projects.read`. */
  projectTitle: string | null;
  /** Upload or link; decides between download and opening the URL. */
  source: FileSource;
  /** Icon and preview category. */
  assetKind: AssetKind;
  /** Original filename or the link label. */
  displayName: string;
  /** Optional plain-text annotation; never rendered as HTML. */
  note: string | null;
  /** Tab the entry appears in, derived from who added it. */
  origin: PortalFileOrigin;
  /** Validated extension; null for links. Drives the preview kind. */
  extension: UploadExtension | null;
  /** Verified byte size; null for links. */
  sizeBytes: number | null;
  /** HTTPS destination for links, never a signed storage URL; null for uploads. */
  url: string | null;
  /** ISO timestamp; lists are ordered by it, newest first. */
  createdAt: string;
}
