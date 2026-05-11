import type { LeadImportReportDto } from "@/common/contracts/leads/import/lead-import-report.dto";

export type LeadImportCsvPreview = {
  recognized: string[];
  ignored: string[];
  hasRequiredColumns: boolean;
};

export const LeadImportDialogPhaseTag = {
  Picking: "picking",
  Previewing: "previewing",
  Submitting: "submitting",
  Result: "result",
  Error: "error",
} as const;

export type LeadImportDialogPhaseTag =
  (typeof LeadImportDialogPhaseTag)[keyof typeof LeadImportDialogPhaseTag];

export type LeadImportDialogPhase =
  | { tag: typeof LeadImportDialogPhaseTag.Picking }
  | {
      tag: typeof LeadImportDialogPhaseTag.Previewing;
      preview: LeadImportCsvPreview;
    }
  | { tag: typeof LeadImportDialogPhaseTag.Submitting }
  | { tag: typeof LeadImportDialogPhaseTag.Result; report: LeadImportReportDto }
  | { tag: typeof LeadImportDialogPhaseTag.Error; message: string };
