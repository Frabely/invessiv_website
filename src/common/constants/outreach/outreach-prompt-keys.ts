export const OutreachPromptKey = {
  FirstTouch: "first-touch",
} as const;

export type OutreachPromptKey =
  (typeof OutreachPromptKey)[keyof typeof OutreachPromptKey];

export const OUTREACH_PROMPT_KEY_VALUES = [
  OutreachPromptKey.FirstTouch,
] as const;
