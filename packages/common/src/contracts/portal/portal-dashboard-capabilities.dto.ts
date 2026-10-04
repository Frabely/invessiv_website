export interface PortalDashboardCapabilitiesDto {
  /** True only for contacts with both task read and completion rights. */
  canCompleteTasks: boolean;
  /** True for contacts who may create a task for the team on the selected project; never the owner view. */
  canCreateTasks: boolean;
  /** True for the audited, read-only workspace owner view. */
  isOwnerView: boolean;
}
