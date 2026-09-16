/** URL state of the CRM overview. Values are ids and modes only — never names or contact data. */
export const CustomerListQueryParam = {
  Mode: "mode",
  Edit: "edit",
} as const;

export type CustomerListQueryParam =
  (typeof CustomerListQueryParam)[keyof typeof CustomerListQueryParam];

export const CUSTOMER_LIST_QUERY_PARAM_VALUES = [
  CustomerListQueryParam.Mode,
  CustomerListQueryParam.Edit,
] as const;
