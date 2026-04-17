import type { ContactLeadStatus } from "@/common/contracts/contact/records/contact-lead-status";
import type { SaveProjectRequestDto } from "@/common/contracts/contact/project-request/save-project-request-dto";
import { leadCallContacts } from "@/server/db/record-configuration/lead-call-contacts";
import { leadEmailContacts } from "@/server/db/record-configuration/lead-email-contacts";
import { leadProjectRequests } from "@/server/db/record-configuration/lead-project-requests";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";
import { leads } from "@/server/db/record-configuration/leads";

type LeadInsert = typeof leads.$inferInsert;
type LeadSubmissionInsert = typeof leadSubmissions.$inferInsert;
type LeadProjectRequestInsert = typeof leadProjectRequests.$inferInsert;
type LeadEmailContactInsert = typeof leadEmailContacts.$inferInsert;
type LeadCallContactInsert = typeof leadCallContacts.$inferInsert;

export type ContactLeadPersistRecord = Omit<LeadInsert, "lead_status"> & {
  lead_status: ContactLeadStatus;
};

export type ContactLeadSubmissionPersistRecord = LeadSubmissionInsert;

export type ContactLeadProjectRequestPersistRecord = Omit<
  LeadProjectRequestInsert,
  | "budget_key"
  | "goal_key"
  | "offer_key"
  | "page_keys"
  | "preferred_start_key"
  | "workflow_key"
> & {
  budget_key?: SaveProjectRequestDto["budgetKey"];
  goal_key?: SaveProjectRequestDto["goalKey"];
  offer_key: SaveProjectRequestDto["offerKey"];
  page_keys?: SaveProjectRequestDto["pageKeys"];
  preferred_start_key?: SaveProjectRequestDto["preferredStartKey"];
  workflow_key?: SaveProjectRequestDto["workflowKey"];
};

export type ContactLeadEmailPersistRecord = LeadEmailContactInsert;
export type ContactLeadCallPersistRecord = LeadCallContactInsert;
