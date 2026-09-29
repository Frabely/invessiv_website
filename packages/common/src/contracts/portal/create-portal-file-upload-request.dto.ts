export interface CreatePortalFileUploadRequestDto {
  /** Original filename; the server derives the content type from its extension. */
  displayName: string;
  /** Announced size must match the uploaded object exactly. */
  sizeBytes: number;
  /** Null or omitted means "General"; otherwise a project released to the portal. */
  projectId?: string | null;
  /** Optional plain-text annotation, at most 200 characters. */
  note?: string | null;
}
