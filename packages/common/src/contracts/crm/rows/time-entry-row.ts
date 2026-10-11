/** Direct mirror of the `project_time_entries` row shape as Drizzle returns it. */
export interface TimeEntryRow {
  id: string;
  customer_id: string;
  project_id: string;
  task_id: string | null;
  performed_on: string;
  duration_minutes: number;
  description: string;
  billable: boolean;
  performed_by_member_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
}
