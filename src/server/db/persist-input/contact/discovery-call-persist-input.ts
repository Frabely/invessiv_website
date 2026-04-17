import type { CallContactRecord } from "@/server/db/records/contact/call-contact-record";
import type { PreparedLeadRecord } from "@/server/db/records/contact/prepared-lead-record";
import type { PreparedLeadSubmissionRecord } from "@/server/db/records/contact/prepared-lead-submission-record";

export type DiscoveryCallPersistInput = {
  callContact: CallContactRecord;
  lead: PreparedLeadRecord;
  submission: PreparedLeadSubmissionRecord;
};
