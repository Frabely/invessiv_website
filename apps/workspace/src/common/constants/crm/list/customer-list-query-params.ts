/** URL state of the CRM overview. Values are ids and modes only — never names or contact data. */
export const CustomerListQueryParam = {
  Page: "page",
  Sort: "sort",
  Archived: "archived",
  Mode: "mode",
  Edit: "edit",
} as const;

export type CustomerListQueryParam =
  (typeof CustomerListQueryParam)[keyof typeof CustomerListQueryParam];

export const CUSTOMER_LIST_QUERY_PARAM_VALUES = [
  CustomerListQueryParam.Page,
  CustomerListQueryParam.Sort,
  CustomerListQueryParam.Archived,
  CustomerListQueryParam.Mode,
  CustomerListQueryParam.Edit,
] as const;
