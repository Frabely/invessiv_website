import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type CallContactRecord = TimestampedRecord & {
  id: string;
  leadSubmissionId: string;
  message?: string;
};
