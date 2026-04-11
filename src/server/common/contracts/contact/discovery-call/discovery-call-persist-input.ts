import type { PreparedLeadRecord } from "@/server/common/contracts/contact/prepared-lead-record";
import type { PreparedLeadSubmissionRecord } from "@/server/common/contracts/contact/prepared-lead-submission-record";
import type { CallContactRecord } from "@/server/common/contracts/contact/discovery-call/call-contact-record";

export type DiscoveryCallPersistInput = {
  callContact: CallContactRecord;
  lead: PreparedLeadRecord;
  submission: PreparedLeadSubmissionRecord;
};
