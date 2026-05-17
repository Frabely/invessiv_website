export const OutreachProvider = {
  LocalLmStudio: "local-lm-studio",
  OpenAi: "openai",
} as const;

export type OutreachProvider =
  (typeof OutreachProvider)[keyof typeof OutreachProvider];

export const OUTREACH_PROVIDER_VALUES = [
  OutreachProvider.LocalLmStudio,
  OutreachProvider.OpenAi,
] as const;
