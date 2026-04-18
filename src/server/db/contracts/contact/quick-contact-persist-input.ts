import type { ContactLeadEmailPersistRecord } from "@/server/db/contracts/contact/contact-lead-email-persist-record";
import type { ContactLeadPersistRecord } from "@/server/db/contracts/contact/contact-lead-persist-record";
import type { ContactLeadSubmissionPersistRecord } from "@/server/db/contracts/contact/contact-lead-submission-persist-record";

export type QuickContactPersistInput = {
  lead: ContactLeadPersistRecord;
  lead_email_contact: ContactLeadEmailPersistRecord;
  lead_submission: ContactLeadSubmissionPersistRecord;
};
