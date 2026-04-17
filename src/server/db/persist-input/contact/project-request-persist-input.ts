import type {
  ContactLeadPersistRecord,
  ContactLeadProjectRequestPersistRecord,
  ContactLeadSubmissionPersistRecord,
} from "@/server/db/persist-input/contact/contact-persist-types";

export type ProjectRequestPersistInput = {
  lead: ContactLeadPersistRecord;
  lead_project_request: ContactLeadProjectRequestPersistRecord;
  lead_submission: ContactLeadSubmissionPersistRecord;
};
