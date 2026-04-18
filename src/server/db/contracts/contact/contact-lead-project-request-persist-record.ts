import type { SaveProjectRequestDto } from "@/common/contracts/contact/project-request/save-project-request-dto";
import { leadProjectRequests } from "@/server/db/record-configuration/lead-project-requests";

type LeadProjectRequestInsert = typeof leadProjectRequests.$inferInsert;

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
