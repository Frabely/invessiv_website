import type { CredentialDto } from "./credential.dto";

export interface CredentialListDto {
  /** Every readable entry of the customer for the requested project filter; never paginated. */
  credentials: CredentialDto[];
}
