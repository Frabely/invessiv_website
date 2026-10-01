/**
 * What the form holds per block-level field while it is filled in: the text of a value field as a
 * list of at most one entry, or the selected option ids of a choice field in display order.
 */
export type OnboardingAnswerDrafts = ReadonlyMap<string, readonly string[]>;
