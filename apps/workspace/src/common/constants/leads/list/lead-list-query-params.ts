export const LeadListQueryParam = {
  Category: "category",
  Convert: "convert",
  DateFrom: "date_from",
  DateTo: "date_to",
  IncludeConverted: "include_converted",
  Mode: "mode",
  TargetLeadId: "edit",
  Page: "page",
  ProfileInclude: "profile_include",
  ProfileExclude: "profile_exclude",
  ScoreMin: "score_min",
  Search: "search",
  Selected: "selected",
  Sort: "sort",
  Source: "source",
  Status: "status",
} as const;

export type LeadListQueryParam =
  (typeof LeadListQueryParam)[keyof typeof LeadListQueryParam];

export const LEAD_LIST_QUERY_PARAM_VALUES = [
  LeadListQueryParam.Category,
  LeadListQueryParam.Convert,
  LeadListQueryParam.DateFrom,
  LeadListQueryParam.DateTo,
  LeadListQueryParam.IncludeConverted,
  LeadListQueryParam.Mode,
  LeadListQueryParam.TargetLeadId,
  LeadListQueryParam.Page,
  LeadListQueryParam.ProfileInclude,
  LeadListQueryParam.ProfileExclude,
  LeadListQueryParam.ScoreMin,
  LeadListQueryParam.Search,
  LeadListQueryParam.Selected,
  LeadListQueryParam.Sort,
  LeadListQueryParam.Source,
  LeadListQueryParam.Status,
] as const;
