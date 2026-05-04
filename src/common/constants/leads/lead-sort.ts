export const LeadSort = {
  CreatedDesc: "created_desc",
  ScoreAsc: "score_asc",
  ScoreDesc: "score_desc",
  NameAsc: "name_asc",
  NameDesc: "name_desc",
} as const;

export type LeadSort = (typeof LeadSort)[keyof typeof LeadSort];

export const LEAD_SORT_VALUES = [
  LeadSort.CreatedDesc,
  LeadSort.ScoreAsc,
  LeadSort.ScoreDesc,
  LeadSort.NameAsc,
  LeadSort.NameDesc,
] as const;
