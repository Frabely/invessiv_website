import type { TimestampedRecord } from "@/server/common/contracts/contact/timestamped-record";

export type EmailContactRecord = TimestampedRecord & {
  id: string;
  leadSubmissionId: string;
  message: string;
};
