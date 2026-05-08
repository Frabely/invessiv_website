export interface LeadCsvParserOptions {
  maxDataRows: number;
}

export interface LeadCsvParseResult {
  headers: string[];
  rows: string[][];
}

export interface LeadCsvParseErrorDetails {
  readonly inputPreview?: string;
}
