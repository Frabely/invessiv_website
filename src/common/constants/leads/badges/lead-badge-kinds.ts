export const LeadBadgeKind = {
  Category: "category",
  Source: "source",
  Status: "status",
} as const;

export type LeadBadgeKind = (typeof LeadBadgeKind)[keyof typeof LeadBadgeKind];

export const LEAD_BADGE_KIND_VALUES = [
  LeadBadgeKind.Category,
  LeadBadgeKind.Source,
  LeadBadgeKind.Status,
] as const;
