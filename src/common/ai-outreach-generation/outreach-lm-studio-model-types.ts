export const OutreachLmStudioModelType = {
  Llm: "llm",
  Embedding: "embedding",
} as const;

export type OutreachLmStudioModelType =
  (typeof OutreachLmStudioModelType)[keyof typeof OutreachLmStudioModelType];

export const OUTREACH_LM_STUDIO_MODEL_TYPE_VALUES = [
  OutreachLmStudioModelType.Llm,
  OutreachLmStudioModelType.Embedding,
] as const;
