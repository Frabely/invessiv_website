export type InsertHourAllocationInput = {
  customerId: string;
  projectId: string;
  minutes: number;
  note: string;
  idempotencyKey: string;
  createdByMemberId: string;
};
