export const LeadSource = {
  Webform: "webform",
  Manual: "manual",
  Import: "import",
} as const;

export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const LEAD_SOURCES_VALUES = [
  LeadSource.Webform,
  LeadSource.Manual,
  LeadSource.Import,
] as const;
