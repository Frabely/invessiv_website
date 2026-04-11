import type { TimestampedRecord } from "@/common/contracts/contact/records/timestamped-record";

export type EmailContactRecord = TimestampedRecord & {
  id: string;
  leadSubmissionId: string;
  message: string;
};
