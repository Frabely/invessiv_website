export interface CreateFileUploadRequestDto {
  /** Original filename; the server derives the content type from its extension. */
  displayName: string;
  /** Announced size must match the uploaded object exactly. */
  sizeBytes: number;
  /** Null or omitted means customer-wide. */
  projectId?: string | null;
  /** Defaults to internal visibility. */
  visibleToCustomer?: boolean;
  /** Optional plain-text annotation, at most 200 characters. */
  note?: string | null;
}
