export const LeadSort = {
  CreatedAsc: "created_asc",
  CreatedDesc: "created_desc",
  ScoreAsc: "score_asc",
  ScoreDesc: "score_desc",
  NameAsc: "name_asc",
  NameDesc: "name_desc",
} as const;

export type LeadSort = (typeof LeadSort)[keyof typeof LeadSort];

export const LEAD_SORT_VALUES = [
  LeadSort.CreatedAsc,
  LeadSort.CreatedDesc,
  LeadSort.ScoreAsc,
  LeadSort.ScoreDesc,
  LeadSort.NameAsc,
  LeadSort.NameDesc,
] as const;
