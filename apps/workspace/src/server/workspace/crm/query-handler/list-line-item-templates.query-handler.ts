import "server-only";

import { desc, eq } from "drizzle-orm";

import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { ListLineItemTemplatesResult } from "@invessiv/common/contracts/crm/results/list-line-item-templates-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { lineItemTemplates } from "@invessiv/db/record-configuration";
import { lineItemTemplatesMapperService } from "@/server/workspace/crm/services/line-item-templates-mapper-service";

export async function listLineItemTemplates(options: {
  includeArchived: boolean;
}): Promise<ListLineItemTemplatesResult> {
  const db = getDrizzleDatabaseClient();
  const rows = await db
    .select()
    .from(lineItemTemplates)
    .where(
      options.includeArchived
        ? undefined
        : eq(lineItemTemplates.status, LineItemTemplateStatus.Active),
    )
    .orderBy(desc(lineItemTemplates.created_at));

  // rows already answers it, except the one case where an active-only query came back empty:
  // that could mean a truly empty catalog or one with only archived rows, so it re-checks unfiltered.
  let hasLineItemTemplates = rows.length > 0;
  if (!hasLineItemTemplates && !options.includeArchived) {
    const anyRow = await db
      .select({ id: lineItemTemplates.id })
      .from(lineItemTemplates)
      .limit(1);
    hasLineItemTemplates = anyRow.length > 0;
  }

  return {
    hasLineItemTemplates,
    rows: rows.map(lineItemTemplatesMapperService.toDto),
  };
}
