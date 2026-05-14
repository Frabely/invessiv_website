import { leads } from "@/server/db/record-configuration";

export type LeadCurrentState = {
  id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  lead_status: typeof leads.$inferSelect.lead_status;
  category_id: string | null;
  score: number | null;
  owner: string | null;
  notes: string | null;
  improvements: string[] | null;
};
