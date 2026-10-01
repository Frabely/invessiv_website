/**
 * What the form holds per slot while it is filled in: the text of a value field as a list of at
 * most one entry, or the selected option ids of a choice field in display order. The key is the
 * field id on block level and field plus entry for a sub-field (`onboardingAnswerDrafts.slotKey`).
 */
export type OnboardingAnswerDrafts = ReadonlyMap<string, readonly string[]>;
