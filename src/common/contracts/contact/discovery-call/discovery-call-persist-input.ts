import type { PreparedLeadRecord } from "@/common/contracts/contact/records/prepared-lead-record";
import type { PreparedLeadSubmissionRecord } from "@/common/contracts/contact/records/prepared-lead-submission-record";
import type { CallContactRecord } from "@/common/contracts/contact/discovery-call/call-contact-record";

export type DiscoveryCallPersistInput = {
  callContact: CallContactRecord;
  lead: PreparedLeadRecord;
  submission: PreparedLeadSubmissionRecord;
};
