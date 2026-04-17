import type { LeadCallContactRecord } from "@/server/db/records/contact/lead-call-contact-record";
import type { LeadRecord } from "@/server/db/records/contact/lead-record";
import type { LeadSubmissionRecord } from "@/server/db/records/contact/lead-submission-record";

export type DiscoveryCallPersistInput = {
  call_contact: LeadCallContactRecord;
  lead: LeadRecord;
  lead_submission: LeadSubmissionRecord;
};
