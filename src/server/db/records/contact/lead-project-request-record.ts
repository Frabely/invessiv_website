import type { SaveProjectRequestDto } from "@/common/contracts/contact/project-request/save-project-request-dto";
import { LEAD_PROJECT_REQUEST_COLUMNS } from "@/server/db/record-configuration/lead-project-requests";
import { defineDatabaseRecord } from "@/server/db/records/shared/database-record-definition";
import type { TimestampedRecord } from "@/server/db/records/shared/timestamped-record";

export type LeadProjectRequestRecord = TimestampedRecord & {
  budget_key?: SaveProjectRequestDto["budgetKey"];
  company?: string;
  custom_page_names?: string[];
  goal_key?: SaveProjectRequestDto["goalKey"];
  id: string;
  lead_submission_id: string;
  offer_key: SaveProjectRequestDto["offerKey"];
  page_keys?: SaveProjectRequestDto["pageKeys"];
  phone?: string;
  preferred_start_key?: SaveProjectRequestDto["preferredStartKey"];
  project_details: string;
  role?: string;
  website?: string;
  workflow_key?: SaveProjectRequestDto["workflowKey"];
};

export const DATABASE_RECORD_DEFINITION =
  defineDatabaseRecord<LeadProjectRequestRecord>()({
    columns: LEAD_PROJECT_REQUEST_COLUMNS,
    tableName: "lead_project_requests",
  });
