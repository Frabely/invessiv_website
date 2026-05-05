import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { leads } from "@/server/db/record-configuration/leads";

type LeadInsert = typeof leads.$inferInsert;

export type ContactLeadPersistRecord = Omit<LeadInsert, "lead_status"> & {
  lead_status: ContactLeadStatus;
};
