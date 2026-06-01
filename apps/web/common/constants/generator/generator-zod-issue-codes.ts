export const GeneratorZodIssueCode = {
  Custom: "custom",
} as const;

export type GeneratorZodIssueCode =
  (typeof GeneratorZodIssueCode)[keyof typeof GeneratorZodIssueCode];
