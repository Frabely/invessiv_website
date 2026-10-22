export const AnalyticsGeneratorStep = {
  Start: "start",
  Submit: "submit",
  Success: "success",
  Error: "error",
  Download: "download",
  Copy: "copy",
} as const;

export type AnalyticsGeneratorStep =
  (typeof AnalyticsGeneratorStep)[keyof typeof AnalyticsGeneratorStep];
