/**
 * Cockpit URL parameters of the files filter. Prefixed because the cockpit shares its URL with
 * the customer list; the free-text search stays out of the URL, it may contain names.
 */
export const CustomerFilesQueryParam = {
  Project: "filesProject",
  Kind: "filesKind",
  Origin: "filesOrigin",
} as const;
export type CustomerFilesQueryParam =
  (typeof CustomerFilesQueryParam)[keyof typeof CustomerFilesQueryParam];

/** Project filter value for entries without a project. */
export const CUSTOMER_WIDE_FILES_FILTER = "customer";
