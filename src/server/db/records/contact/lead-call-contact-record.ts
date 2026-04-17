import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type LeadCallContactRecord = TimestampedRecord & {
  id: string;
  lead_submission_id: string;
  message?: string;
};
