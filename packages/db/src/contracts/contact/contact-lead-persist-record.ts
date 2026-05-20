import type { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { leads } from "@invessiv/db/record-configuration/leads";

type LeadInsert = typeof leads.$inferInsert;

export type ContactLeadPersistRecord = Omit<LeadInsert, "lead_status"> & {
  lead_status: ContactLeadStatus;
};
