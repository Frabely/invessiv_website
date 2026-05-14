import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";

export interface BulkEditLeadsPatch {
  status?: ContactLeadStatus;
  category_id?: string | null;
  score?: number | null;
  owner?: string | null;
  notes_append?: string;
  improvements_append?: string[];
}

export interface BulkEditLeadsInput {
  ids: string[];
  patch: BulkEditLeadsPatch;
}
