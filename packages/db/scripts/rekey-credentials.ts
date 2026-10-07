/**
 * Re-encrypts every stored credential value that was written with an older key version.
 *
 * Run after a new key was appended to CRM_CREDENTIALS_KEYRING and deployed. One transaction per
 * row, so an aborted run leaves every row readable and the next run continues where it stopped.
 * This is a technical rewrite, not an edit: `version`, `updated_at` and `secret_changed_at` stay.
 *
 * The output is counts only. No id is ever printed next to a value, and no ciphertext at all.
 */
import { eq } from "drizzle-orm";

import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { credentialCipher } from "@invessiv/db/credentials/credential-cipher";
import { parseCredentialKeyring } from "@invessiv/db/credentials/credential-keyring";
import type { CredentialKeyring } from "@invessiv/db/credentials/credential-cipher-types";
import { customerCredentials } from "@invessiv/db/record-configuration";
import {
  configureDatabaseUrlFromTarget,
  DATABASE_TARGETS,
  parseDatabaseTarget,
} from "./database-target";

const RowOutcome = {
  Rewritten: "rewritten",
  Current: "current",
  Gone: "gone",
} as const;
type RowOutcome = (typeof RowOutcome)[keyof typeof RowOutcome];

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

async function rekeyRow(
  db: Database,
  keyring: CredentialKeyring,
  id: string,
): Promise<RowOutcome> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: customerCredentials.id,
        customerId: customerCredentials.customer_id,
        secret: customerCredentials.secret_ciphertext,
        note: customerCredentials.note_ciphertext,
      })
      .from(customerCredentials)
      .where(eq(customerCredentials.id, id))
      .for("update");
    if (!row) return RowOutcome.Gone;

    const renew = (ciphertext: string, field: CredentialSecretField) => {
      if (credentialCipher.readKeyVersion(ciphertext) === keyring.activeVersion)
        return null;
      const context = {
        customerId: row.customerId,
        credentialId: row.id,
        field,
      };
      return credentialCipher.encrypt(
        keyring,
        credentialCipher.decrypt(keyring, ciphertext, context),
        context,
      );
    };
    const secret = renew(row.secret, CredentialSecretField.Secret);
    const note =
      row.note === null ? null : renew(row.note, CredentialSecretField.Note);
    if (secret === null && note === null) return RowOutcome.Current;

    // Deliberately not updateVersioned: an editor that has the row open must not get a conflict.
    await tx
      .update(customerCredentials)
      .set({
        ...(secret === null ? {} : { secret_ciphertext: secret }),
        ...(note === null ? {} : { note_ciphertext: note }),
      })
      .where(eq(customerCredentials.id, row.id));
    return RowOutcome.Rewritten;
  });
}

async function run() {
  const target = parseDatabaseTarget(process.argv);
  if (!target) {
    throw new Error(
      `A database target is required. Use one of: ${DATABASE_TARGETS.join(", ")}.`,
    );
  }

  // Read before the env files load: the keyring must come from the caller's environment, so a
  // development key from a local file is never tried against another target.
  const rawKeyring = process.env.CRM_CREDENTIALS_KEYRING;
  configureDatabaseUrlFromTarget(target);
  // Throws with a code only; the key text never reaches the console.
  const keyring = parseCredentialKeyring(rawKeyring);

  const db = getDrizzleDatabaseClient();
  const rows = await db
    .select({ id: customerCredentials.id })
    .from(customerCredentials);

  const counts = { rewritten: 0, current: 0, gone: 0, failed: 0 };
  for (const { id } of rows) {
    try {
      counts[await rekeyRow(db, keyring, id)] += 1;
    } catch {
      // The error is not printed: it belongs to one row and could sit next to its values.
      counts.failed += 1;
    }
  }

  console.log(
    `Target: ${target}, active key version: ${keyring.activeVersion}`,
  );
  console.log(`Checked: ${rows.length}`);
  console.log(`Rewritten: ${counts.rewritten}`);
  console.log(`Already current: ${counts.current}`);
  if (counts.gone > 0) console.log(`Deleted meanwhile: ${counts.gone}`);
  console.log(`Failed: ${counts.failed}`);

  if (counts.failed > 0) {
    throw new Error(
      `${counts.failed} credentials could not be re-encrypted. Check that the keyring still contains every older key.`,
    );
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
