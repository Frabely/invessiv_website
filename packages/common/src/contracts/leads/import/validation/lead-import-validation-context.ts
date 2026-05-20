export interface LeadImportValidationContext {
  rowIndex: number;
  seenEmails: Set<string>;
  seenExternalGuids: Set<string>;
}
