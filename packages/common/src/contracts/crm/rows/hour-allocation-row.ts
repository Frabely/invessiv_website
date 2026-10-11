/** Direct mirror of the `project_hour_allocations` row shape as Drizzle returns it. */
export interface HourAllocationRow {
  id: string;
  customer_id: string;
  project_id: string;
  minutes: number;
  note: string;
  idempotency_key: string;
  created_by_member_id: string;
  created_at: Date;
}
