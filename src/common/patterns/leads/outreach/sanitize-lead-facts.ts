import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import type { OutreachLeadFacts } from "@/common/contracts/leads/outreach/outreach-lead-facts";

export function sanitizeLeadFacts(lead: LeadDetailDto): OutreachLeadFacts {
  return {
    displayName: lead.displayName,
    firstName: lead.firstName,
    companyName: lead.companyName,
    websiteUrl: lead.websiteUrl,
    categoryLabel: lead.category?.labelKey ?? null,
    notes: lead.notes,
    improvements: lead.improvements ?? [],
    owner: lead.owner,
  };
}
