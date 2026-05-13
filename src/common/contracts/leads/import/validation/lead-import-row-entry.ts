import type { LeadImportRowIssueDto } from "@/common/contracts/leads";

export interface ValidatedRowEntry<TValidatedValue = unknown> {
  ok: true;
  rowIndex: number;
  emailLower: string | undefined;
  externalGuid: string | undefined;
  validatedValue: TValidatedValue;
  issues: LeadImportRowIssueDto[];
}

export interface InvalidRowEntry {
  ok: false;
  rowIndex: number;
  issues: LeadImportRowIssueDto[];
}

export type RowEntry<TValidatedValue = unknown> =
  | ValidatedRowEntry<TValidatedValue>
  | InvalidRowEntry;
