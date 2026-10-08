import { randomUUID } from "node:crypto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { credentialCipher } from "@invessiv/db/credentials/credential-cipher";
import { CredentialCipherError } from "@invessiv/db/credentials/credential-cipher-error.class";
import { parseCredentialKeyring } from "@invessiv/db/credentials/credential-keyring";
import type { CredentialKeyring } from "@invessiv/db/credentials/credential-cipher-types";
import { customerCredentials } from "@invessiv/db/record-configuration";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import { readTargetEnvValue, type DatabaseTarget } from "../database-target";

type CredentialFixture = {
  title: string;
  credentialType: CredentialType;
  url: string;
  username: string;
  secret: string;
  note: string | null;
  onProject: boolean;
  /** Released to the portal, so the credentials page has something to show. */
  visibleToCustomer: boolean;
};

/** Obvious mock values; nothing here opens a real account. */
const CREDENTIAL_FIXTURES: CredentialFixture[] = [
  {
    title: "Domain-Anbieter (Mock)",
    credentialType: CredentialType.DomainRegistrar,
    url: "https://example.com/domains",
    username: "kunde@example.com",
    secret: "mock-domain-passwort",
    note: "Beispieldaten für die lokale Entwicklung",
    onProject: false,
    visibleToCustomer: true,
  },
  {
    title: "Mailkonto (Mock)",
    credentialType: CredentialType.Email,
    url: "https://example.com/webmail",
    username: "info@example.com",
    secret: "mock-mail-passwort",
    note: null,
    onProject: false,
    visibleToCustomer: false,
  },
  {
    title: "Hosting (Mock)",
    credentialType: CredentialType.Hosting,
    url: "https://example.com/hosting",
    username: "deploy@example.com",
    secret: "mock-hosting-token",
    note: "Zugang gilt nur für dieses Projekt",
    onProject: true,
    visibleToCustomer: false,
  },
];

/** Null without a usable keyring: the seed then skips credentials instead of failing. */
export function readCredentialFixtureKeyring(
  target: DatabaseTarget,
): CredentialKeyring | null {
  try {
    return parseCredentialKeyring(
      process.env.CRM_CREDENTIALS_KEYRING ??
        readTargetEnvValue(target, "CRM_CREDENTIALS_KEYRING") ??
        undefined,
    );
  } catch (error) {
    if (error instanceof CredentialCipherError) return null;
    throw error;
  }
}

/**
 * Two customer-wide entries and one project entry per customer, all internal; one of the
 * customer-wide entries is released to the portal.
 * Returns the number of rows written.
 */
export async function seedCredentials(
  tx: ContactDatabaseTransaction,
  targets: { customerId: string; projectId: string }[],
  memberId: string,
  keyring: CredentialKeyring | null,
): Promise<number> {
  if (!keyring) {
    console.log(
      "Skipped credentials: CRM_CREDENTIALS_KEYRING is not set or invalid.",
    );
    return 0;
  }

  const now = new Date();
  const rows = targets.flatMap(({ customerId, projectId }) =>
    CREDENTIAL_FIXTURES.map((fixture) => {
      // The id is part of the cipher context, so it exists before anything is encrypted.
      const id = randomUUID();
      const encrypt = (plaintext: string, field: CredentialSecretField) =>
        credentialCipher.encrypt(keyring, plaintext, {
          customerId,
          credentialId: id,
          field,
        });
      return {
        id,
        customer_id: customerId,
        project_id: fixture.onProject ? projectId : null,
        title: fixture.title,
        credential_type: fixture.credentialType,
        url: fixture.url,
        username: fixture.username,
        secret_ciphertext: encrypt(
          fixture.secret,
          CredentialSecretField.Secret,
        ),
        note_ciphertext:
          fixture.note === null
            ? null
            : encrypt(fixture.note, CredentialSecretField.Note),
        visible_to_customer: fixture.visibleToCustomer,
        created_by_side: CredentialSide.Internal,
        created_by_member_id: memberId,
        secret_changed_at: now,
        version: 1,
      };
    }),
  );
  if (rows.length > 0) await tx.insert(customerCredentials).values(rows);
  return rows.length;
}
