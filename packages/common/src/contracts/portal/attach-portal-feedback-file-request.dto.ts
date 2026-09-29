/** Hangs a finished own upload or link onto one feedback item. */
export interface AttachPortalFeedbackFileRequestDto {
  /** File entry created through the portal upload; it must not belong to another item yet. */
  fileId: string;
}
