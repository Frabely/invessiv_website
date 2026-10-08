import type { PortalCredentialDto } from "./portal-credential.dto";

export interface PortalCredentialUpdatedDto {
  /** Always true; the confirmation a contact without the read permission gets. */
  updated: true;
  /** The entry after the change, or null when the contact may change credentials but not list them. */
  credential: PortalCredentialDto | null;
}
