import type { CredentialRow } from "@/server/shared/services/credential/credential-row-types";

/**
 * What the portal list and mapper work with: only the columns the portal may show, without either
 * ciphertext and without release state, last reveal or creator ids.
 */
export type PortalCredentialMetadataRow = Pick<
  CredentialRow,
  | "id"
  | "project_id"
  | "title"
  | "credential_type"
  | "url"
  | "username"
  | "created_by_side"
  | "secret_changed_at"
  | "version"
> & {
  has_note: boolean;
};
