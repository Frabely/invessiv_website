/**
 * How long a draft rests after the last keystroke before it is saved: long enough to not save on
 * every key, short enough that a reload rarely loses anything. Feedback sheet and onboarding form
 * share the rhythm.
 */
export const DRAFT_AUTOSAVE_DELAY_MS = 1_500;
