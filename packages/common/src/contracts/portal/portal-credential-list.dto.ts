import type { PortalCredentialCapabilitiesDto } from "./portal-credential-capabilities.dto";
import type { PortalCredentialProjectOptionDto } from "./portal-credential-project-option.dto";
import type { PortalCredentialDto } from "./portal-credential.dto";

export interface PortalCredentialListDto {
  /** Every released entry the viewer may see; never paginated and never with a secret. */
  credentials: PortalCredentialDto[];
  /** Projects the portal shows: group titles for the list and targets for a new entry. */
  projects: PortalCredentialProjectOptionDto[];
  /** Actions the page may offer; the server checks each of them again. */
  capabilities: PortalCredentialCapabilitiesDto;
  /** False without an encryption key on the server: adding, changing a secret and revealing are unavailable. */
  configured: boolean;
}
