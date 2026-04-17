import type {
  ContactLeadCallPersistRecord,
  ContactLeadPersistRecord,
  ContactLeadSubmissionPersistRecord,
} from "@/server/db/persist-input/contact/contact-persist-types";

export type DiscoveryCallPersistInput = {
  call_contact: ContactLeadCallPersistRecord;
  lead: ContactLeadPersistRecord;
  lead_submission: ContactLeadSubmissionPersistRecord;
};
