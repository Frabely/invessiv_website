export const CredentialQueryParam = {
  ProjectId: "projectId",
} as const;

/** `projectId=null` asks for customer-wide entries only; a missing parameter means all. */
export const CREDENTIAL_CUSTOMER_WIDE_QUERY_VALUE = "null";
