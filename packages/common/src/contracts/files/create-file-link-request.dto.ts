export interface CreateFileLinkRequestDto {
  /** Human-readable label, required even when the URL contains a filename. */
  displayName: string;
  /** HTTPS destination; the server never fetches it. */
  url: string;
  /** Null or omitted means customer-wide. */
  projectId?: string | null;
  /** Defaults to internal visibility. */
  visibleToCustomer?: boolean;
  /** Optional plain-text annotation, at most 200 characters. */
  note?: string | null;
}
