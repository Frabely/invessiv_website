import "server-only";

import { inArray, sql } from "drizzle-orm";

import { getDrizzleDatabaseClient } from "@/server/db/core";
import { leads } from "@/server/db/record-configuration";

export interface ExistingLeadKeys {
  emailToLeadId: Map<string, string>;
  guidToLeadId: Map<string, string>;
}

async function loadExistingKeys(
  emails: string[],
  guids: string[],
): Promise<ExistingLeadKeys> {
  const emailToLeadId = new Map<string, string>();
  const guidToLeadId = new Map<string, string>();

  if (emails.length === 0 && guids.length === 0) {
    return { emailToLeadId, guidToLeadId };
  }

  const db = getDrizzleDatabaseClient();

  const [emailRows, guidRows] = await Promise.all([
    emails.length > 0
      ? db
          .select({ id: leads.id, email: leads.email })
          .from(leads)
          .where(
            inArray(
              sql`lower(btrim(
                        ${leads.email}
                        )
                        )`,
              emails,
            ),
          )
      : Promise.resolve([]),
    guids.length > 0
      ? db
          .select({ id: leads.id, external_guid: leads.external_guid })
          .from(leads)
          .where(inArray(leads.external_guid, guids))
      : Promise.resolve([]),
  ]);

  for (const row of emailRows) {
    if (row.email) {
      emailToLeadId.set(row.email.toLowerCase().trim(), row.id);
    }
  }

  for (const row of guidRows) {
    if (row.external_guid) {
      guidToLeadId.set(row.external_guid, row.id);
    }
  }

  return { emailToLeadId, guidToLeadId };
}

export const leadImportExistingKeysLoaderService = {
  loadExistingKeys,
};
