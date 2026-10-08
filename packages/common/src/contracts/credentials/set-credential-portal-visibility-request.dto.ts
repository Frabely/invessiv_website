/** Releases one entry to the portal or takes the release back. */
export interface SetCredentialPortalVisibilityRequestDto {
  /** Version the dialog loaded; a newer row answers with a conflict. */
  version: number;
  /** True makes username, secret and note readable for contacts holding the portal credential role. False is refused for entries the customer created. */
  visibleToCustomer: boolean;
}
