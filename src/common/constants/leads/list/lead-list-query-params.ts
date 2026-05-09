export const LeadListQueryParam = {
  Category: "category",
  Create: "create",
  DateFrom: "date_from",
  DateTo: "date_to",
  Edit: "edit",
  Page: "page",
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
  LeadListQueryParam.Create,
  LeadListQueryParam.DateFrom,
  LeadListQueryParam.DateTo,
  LeadListQueryParam.Edit,
  LeadListQueryParam.Page,
  LeadListQueryParam.ScoreMin,
  LeadListQueryParam.Search,
  LeadListQueryParam.Selected,
  LeadListQueryParam.Sort,
  LeadListQueryParam.Source,
  LeadListQueryParam.Status,
] as const;
