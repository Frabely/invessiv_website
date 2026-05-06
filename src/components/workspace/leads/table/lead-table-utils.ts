import type { LeadSummaryDto } from "@/common/contracts/leads/lead-summary.dto";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export function buildQueryStringFromSearchParams(
  searchParams: SearchParamsInput,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "selected") {
      continue;
    }

    const normalizedValue = Array.isArray(value) ? value[0] : value;
    if (normalizedValue) {
      params.set(key, normalizedValue);
    }
  }

  return params.toString();
}

export function buildLeadHref(
  basePath: string,
  queryString: string,
  overrides: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams(queryString);

  for (const [key, value] of Object.entries(overrides)) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }

  const nextQuery = params.toString();
  return nextQuery ? `${basePath}?${nextQuery}` : basePath;
}

export function getLeadDisplayName(lead: LeadSummaryDto): string {
  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
  return fullName || lead.companyName || lead.email;
}

export function getLeadInitials(lead: LeadSummaryDto): string {
  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
  const source = fullName || lead.companyName || lead.email;
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "L";
}

export function getLeadSecondaryLabel(lead: LeadSummaryDto): string {
  return lead.websiteUrl ?? lead.email;
}

export function formatLeadCreatedAt(locale: string, createdAt: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(createdAt));
}
