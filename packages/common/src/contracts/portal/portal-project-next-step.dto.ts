export interface PortalProjectNextStepDto {
  /** Next action text; null if only a date was entered. */
  label: string | null;
  /** Next action date; null if only a label was entered. */
  dueOn: string | null;
}
