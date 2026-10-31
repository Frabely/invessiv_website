/** One option of a choice question; every option is listed, selected or not. */
export interface OnboardingExportOptionDto {
  /** Stable key of the option; `yes`/`no` for a yes/no question. */
  key: string;
  /** Label in the export locale. */
  label: string;
  /** Whether the customer picked it; an option left out says as much as one picked. */
  selected: boolean;
}
