export const LeadCsvSeparator = {
  Semicolon: ";",
  Comma: ",",
} as const;

export type LeadCsvSeparator =
  (typeof LeadCsvSeparator)[keyof typeof LeadCsvSeparator];

export interface LeadCsvRowState {
  currentRow: string[];
  currentField: string;
  inQuotes: boolean;
  afterQuote: boolean;
  rowHasStructuralContent: boolean;
}
