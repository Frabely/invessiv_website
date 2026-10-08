import type { PortalCredentialDto } from "./portal-credential.dto";

export interface PortalCredentialCreatedDto {
  /** Always true; the confirmation a contact without the read permission gets. */
  created: true;
  /** The new entry, or null when the contact may add credentials but not list them. */
  credential: PortalCredentialDto | null;
}
