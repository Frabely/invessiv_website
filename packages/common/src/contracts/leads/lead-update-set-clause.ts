import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";

export type LeadUpdateSetClause = {
  updated_at: Date;
  lead_status?: ContactLeadStatus;
  category_id?: string | null;
  score?: number | null;
  owner?: string | null;
  notes?: string | null;
  improvements?: string[] | null;
};
