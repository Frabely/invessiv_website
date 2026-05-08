export const LeadCsvSeparator = {
  Semicolon: ";",
  Comma: ",",
} as const;

export type LeadCsvSeparator =
  (typeof LeadCsvSeparator)[keyof typeof LeadCsvSeparator];
