export const LEAD_SOURCES = ["webform", "manual", "import"] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
