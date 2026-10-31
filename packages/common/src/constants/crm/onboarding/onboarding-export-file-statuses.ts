/**
 * Whether an attached file made it into the export archive. Only `included` carries a path; the
 * export never fails because of a file.
 */
export const OnboardingExportFileStatus = {
  Included: "included",
  /** A link entry; only its URL is exported. */
  Link: "link",
  /** The exporting member may not open the file; nothing but its existence is exported. */
  NoAccess: "no_access",
  Video: "video",
  /** Left out because the archive reached its byte limit. */
  SizeLimit: "size_limit",
  /** Left out because the archive ran out of time. */
  Timeout: "timeout",
  /** The storage could not deliver the file. */
  Unreadable: "unreadable",
} as const;

export type OnboardingExportFileStatus =
  (typeof OnboardingExportFileStatus)[keyof typeof OnboardingExportFileStatus];

export const ONBOARDING_EXPORT_FILE_STATUS_VALUES = [
  OnboardingExportFileStatus.Included,
  OnboardingExportFileStatus.Link,
  OnboardingExportFileStatus.NoAccess,
  OnboardingExportFileStatus.Video,
  OnboardingExportFileStatus.SizeLimit,
  OnboardingExportFileStatus.Timeout,
  OnboardingExportFileStatus.Unreadable,
] as const;
