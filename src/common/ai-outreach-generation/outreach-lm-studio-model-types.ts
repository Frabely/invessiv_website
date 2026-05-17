export const OutreachLmStudioModelType = {
  Llm: "llm",
  Embedding: "embedding",
} as const;

export type OutreachLmStudioModelType =
  (typeof OutreachLmStudioModelType)[keyof typeof OutreachLmStudioModelType];
