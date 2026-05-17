import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";

export interface OutreachLeadFacts {
  firstName: string | null;
  companyName: string | null;
  websiteUrl: string | null;
  categoryLabel: string | null;
  notes: string | null;
  improvements: string[];
  owner: string | null;
}

export function sanitizeLeadFacts(lead: LeadDetailDto): OutreachLeadFacts {
  return {
    firstName: lead.firstName,
    companyName: lead.companyName,
    websiteUrl: lead.websiteUrl,
    categoryLabel: lead.category?.labelKey ?? null,
    notes: lead.notes,
    improvements: lead.improvements ?? [],
    owner: lead.owner,
  };
}
