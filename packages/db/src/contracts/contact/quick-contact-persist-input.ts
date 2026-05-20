import type { ContactLeadEmailPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-email-persist-record";
import type { ContactLeadPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-persist-record";
import type { ContactLeadSubmissionPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-submission-persist-record";

export type QuickContactPersistInput = {
  lead: ContactLeadPersistRecord;
  lead_email_contact: ContactLeadEmailPersistRecord;
  lead_submission: ContactLeadSubmissionPersistRecord;
};
