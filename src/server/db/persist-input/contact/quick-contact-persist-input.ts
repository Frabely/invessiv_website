import type {
  ContactLeadEmailPersistRecord,
  ContactLeadPersistRecord,
  ContactLeadSubmissionPersistRecord,
} from "@/server/db/persist-input/contact/contact-persist-types";

export type QuickContactPersistInput = {
  lead: ContactLeadPersistRecord;
  lead_email_contact: ContactLeadEmailPersistRecord;
  lead_submission: ContactLeadSubmissionPersistRecord;
};
