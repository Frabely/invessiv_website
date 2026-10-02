/** Appends one repetition to a group field of a form the customer may edit. */
export interface AddPortalOnboardingGroupEntryRequestDto {
  /** Created by the client, so sub-field autosaves can address the entry at once. */
  id: string;
  /** Group field the entry belongs to; it must sit in a block of the addressed form. */
  fieldId: string;
}
