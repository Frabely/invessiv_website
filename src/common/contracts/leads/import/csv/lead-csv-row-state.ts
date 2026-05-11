export interface LeadCsvRowState {
  currentRow: string[];
  currentField: string;
  inQuotes: boolean;
  afterQuote: boolean;
  rowHasStructuralContent: boolean;
}
