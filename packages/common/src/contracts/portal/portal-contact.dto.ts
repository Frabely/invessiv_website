export interface PortalContactDto {
  /** Public display name of the customer's assigned workspace contact. */
  displayName: string;
  /** Public contact address; it is never used to authorize portal access. */
  email: string;
}
