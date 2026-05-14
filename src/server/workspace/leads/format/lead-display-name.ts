import "server-only";

const FALLBACK_DISPLAY_NAME = "—";

export type LeadDisplayNameInput = {
  display_name: string | null;
  company_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

export function formatLeadDisplayName(lead: LeadDisplayNameInput): string {
  if (lead.display_name && lead.display_name.trim().length > 0) {
    return lead.display_name.trim();
  }

  if (lead.company_name && lead.company_name.trim().length > 0) {
    return lead.company_name.trim();
  }

  const nameParts = [lead.first_name, lead.last_name]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0);
  if (nameParts.length > 0) {
    return nameParts.join(" ");
  }

  if (lead.email && lead.email.trim().length > 0) {
    return lead.email.trim();
  }

  return FALLBACK_DISPLAY_NAME;
}
