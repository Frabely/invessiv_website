/** One repetition of a group, e.g. one team member. */
export interface OnboardingGroupEntryDto {
  /** Created by the client so it stays stable across autosaves; sub-field answers reference it. */
  id: string;
  /** Group field the entry belongs to. */
  fieldId: string;
  /** Display order within the group, starting at 0. */
  position: number;
}
