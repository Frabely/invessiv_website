import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";

/**
 * What the credential form reads from a stored entry. The CRM and the portal DTO both satisfy it,
 * so both worlds share one form. Secret and note text are never part of it.
 */
export type CredentialFormSource = Pick<
  CredentialDto,
  | "id"
  | "title"
  | "credentialType"
  | "projectId"
  | "url"
  | "username"
  | "hasNote"
  | "version"
>;
