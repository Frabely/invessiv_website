/** Hangs a finished own upload or link onto a files field of a form the customer may edit. */
export interface AttachPortalOnboardingFileRequestDto {
  /** Files field the file is attached to; it must sit in a block of the addressed form. */
  fieldId: string;
  /** Group entry of a files sub-field; null on block level. */
  groupEntryId: string | null;
  /** File entry created through the portal upload for the form's project. */
  fileId: string;
}
