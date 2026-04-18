import type { ContactLeadStatus } from "@/common/contracts/contact/records/contact-lead-status";
import { leads } from "@/server/db/record-configuration/leads";

type LeadInsert = typeof leads.$inferInsert;

export type ContactLeadPersistRecord = Omit<LeadInsert, "lead_status"> & {
  lead_status: ContactLeadStatus;
};
