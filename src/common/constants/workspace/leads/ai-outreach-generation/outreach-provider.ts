export const OutreachProvider = {
  OpenAi: "openai",
} as const;

export type OutreachProvider =
  (typeof OutreachProvider)[keyof typeof OutreachProvider];
