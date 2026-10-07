/**
 * Cockpit URL parameter of the credentials project filter. Prefixed because the cockpit shares its
 * URL with the customer list, and separate from the files filter on purpose: the two sections
 * filter independently.
 */
export const CustomerCredentialsQueryParam = {
  Project: "credentialsProject",
} as const;

export type CustomerCredentialsQueryParam =
  (typeof CustomerCredentialsQueryParam)[keyof typeof CustomerCredentialsQueryParam];

/** Project filter value for entries without a project. */
export const CUSTOMER_WIDE_CREDENTIALS_FILTER = "customer";
