import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";

export type LeadCurrentState = {
  id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  lead_status: ContactLeadStatus;
  category_id: string | null;
  score: number | null;
  owner: string | null;
  notes: string | null;
  improvements: string[] | null;
};
