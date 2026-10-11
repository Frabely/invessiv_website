/** `project_time_entries` joined with its optional task, narrowed to what the portal may map. */
export interface PortalTimeEntryRow {
  id: string;
  project_id: string;
  performed_on: string;
  duration_minutes: number;
  description: string;
  billable: boolean;
  created_at: Date;
  task_title: string | null;
  task_visible_to_customer: boolean | null;
}
