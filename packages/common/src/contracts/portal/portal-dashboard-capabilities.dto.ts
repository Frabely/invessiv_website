export interface PortalDashboardCapabilitiesDto {
  /** True only for contacts with both task read and completion rights. */
  canCompleteTasks: boolean;
  /** True for the audited, read-only workspace owner view. */
  isOwnerView: boolean;
}
