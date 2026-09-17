import "server-only";

import { and, inArray, isNotNull, isNull } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { activities, leads } from "@invessiv/db/record-configuration";

async function deleteLeads(ids: string[]): Promise<string[]> {
  if (ids.length === 0) {
    return [];
  }

  const db = getDrizzleDatabaseClient();
  return db.transaction(async (tx) => {
    await tx
      .delete(activities)
      .where(
        and(inArray(activities.lead_id, ids), isNull(activities.customer_id)),
      );
    await tx
      .update(activities)
      .set({ lead_id: null })
      .where(
        and(
          inArray(activities.lead_id, ids),
          isNotNull(activities.customer_id),
        ),
      );
    const deleted = await tx
      .delete(leads)
      .where(inArray(leads.id, ids))
      .returning({ id: leads.id });

    return deleted.map(({ id }) => id);
  });
}

export const leadService = { delete: deleteLeads } as const;
