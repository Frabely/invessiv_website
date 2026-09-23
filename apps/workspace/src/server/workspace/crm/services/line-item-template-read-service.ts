import "server-only";

import { count, desc, eq } from "drizzle-orm";

import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { lineItemTemplates } from "@invessiv/db/record-configuration";
import { lineItemTemplatesMapperService } from "@/server/workspace/crm/services/line-item-templates-mapper-service";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

function getCondition(includeArchived: boolean) {
  return includeArchived
    ? undefined
    : eq(lineItemTemplates.status, LineItemTemplateStatus.Active);
}

async function countRows(
  db: Database,
  includeArchived: boolean,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(lineItemTemplates)
    .where(getCondition(includeArchived));

  return row?.total ?? 0;
}

/** `page` is left out for a caller that wants the full matching set, such as the assignment picker. */
async function listRows(
  db: Database,
  includeArchived: boolean,
  page?: { limit: number; offset: number },
): Promise<LineItemTemplateDto[]> {
  const query = db
    .select()
    .from(lineItemTemplates)
    .where(getCondition(includeArchived))
    .orderBy(desc(lineItemTemplates.created_at));
  const rows = await (page
    ? query.limit(page.limit).offset(page.offset)
    : query);

  return rows.map(lineItemTemplatesMapperService.toDto);
}

export const lineItemTemplateReadService = { countRows, listRows } as const;
