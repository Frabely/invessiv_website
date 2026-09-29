export interface CreatePortalFileLinkRequestDto {
  /** Human-readable label, required even when the URL contains a filename. */
  displayName: string;
  /** HTTPS destination; the server never fetches it. */
  url: string;
  /** Null or omitted means "General"; otherwise a project released to the portal. */
  projectId?: string | null;
  /** Optional plain-text annotation, at most 200 characters. */
  note?: string | null;
}
