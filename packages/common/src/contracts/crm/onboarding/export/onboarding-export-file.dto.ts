import type { OnboardingExportFileStatus } from "../../../../constants/crm/onboarding/onboarding-export-file-statuses";
import type { AssetKind } from "../../../../constants/files/asset-kind";
import type { OnboardingExportFileUsageDto } from "./onboarding-export-file-usage.dto";

/** One file or link attached to a files question. */
export interface OnboardingExportFileDto {
  /**
   * Id of the file entry; the same file attached to several questions carries the same id there.
   * Null when the exporting member may not open the file.
   */
  fileId: string | null;
  /** Original filename or link title; null when the exporting member may not open the file. */
  name: string | null;
  /** Kind of the file; null when the exporting member may not open it. */
  kind: AssetKind | null;
  /** Whether and why the file is part of the archive; only `included` has a `path`. */
  status: OnboardingExportFileStatus;
  /**
   * Path inside the archive, starting with `ONBOARDING_EXPORT_FILES_FOLDER`; null unless included.
   * A file used by several questions lies once below `ONBOARDING_EXPORT_SHARED_FOLDER`.
   */
  path: string | null;
  /** Target of a link entry; null for uploads. */
  url: string | null;
  /** Note the uploader added; null when left empty or not readable. */
  note: string | null;
  /**
   * Every question the file is attached to in form order, this one included; more than one entry
   * means the same file is reused. Empty when the exporting member may not open the file.
   */
  usedIn: OnboardingExportFileUsageDto[];
}
