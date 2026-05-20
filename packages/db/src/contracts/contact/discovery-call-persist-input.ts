import type { ContactLeadCallPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-call-persist-record";
import type { ContactLeadPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-persist-record";
import type { ContactLeadSubmissionPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-submission-persist-record";

export type DiscoveryCallPersistInput = {
  call_contact: ContactLeadCallPersistRecord;
  lead: ContactLeadPersistRecord;
  lead_submission: ContactLeadSubmissionPersistRecord;
};
