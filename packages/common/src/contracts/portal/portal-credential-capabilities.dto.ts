/** What the viewer may do with the company's released credentials; company-wide, not per entry. */
export interface PortalCredentialCapabilitiesDto {
  /** Add entries and change released ones. Always false in the owner's read-only view. */
  canWrite: boolean;
  /** Request a secret or note in plaintext, one field per request. Always false in the owner's read-only view. */
  canReveal: boolean;
}
