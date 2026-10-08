import type { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import type { customerCredentials } from "@invessiv/db/record-configuration";

export type CredentialRow = typeof customerCredentials.$inferSelect;

/** Who an entry comes from; exactly one origin, matching the table's origin check. */
export type CredentialOrigin =
  | { memberId: string; portalMembershipId?: never }
  | { memberId?: never; portalMembershipId: string };

/** Validated values of a new entry, still in plaintext. */
export type CredentialInsertInput = {
  customerId: string;
  projectId: string | null;
  title: string;
  credentialType: CredentialType;
  url: string | null;
  username: string | null;
  secret: string;
  note: string | null;
  visibleToCustomer: boolean;
  origin: CredentialOrigin;
  now: Date;
};

/** Validated edit; an omitted field stays, and the note has three states (omitted, text, null). */
export type CredentialEditInput = {
  projectId?: string | null;
  title?: string;
  credentialType?: CredentialType;
  url?: string | null;
  username?: string | null;
  secret?: string;
  note?: string | null;
};

export type CredentialPatch = Partial<
  Pick<
    CredentialRow,
    | "project_id"
    | "title"
    | "credential_type"
    | "url"
    | "username"
    | "secret_ciphertext"
    | "note_ciphertext"
    | "secret_changed_at"
  >
>;
