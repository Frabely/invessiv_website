import "server-only";

import { desc, eq } from "drizzle-orm";

import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import type { ListServiceTemplatesResult } from "@invessiv/common/contracts/crm/results/list-service-templates-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { serviceTemplates } from "@invessiv/db/record-configuration";
import { serviceTemplatesMapperService } from "@/server/workspace/crm/services/service-templates-mapper-service";

export async function listServiceTemplates(options: {
  includeArchived: boolean;
}): Promise<ListServiceTemplatesResult> {
  const db = getDrizzleDatabaseClient();
  const rows = await db
    .select()
    .from(serviceTemplates)
    .where(
      options.includeArchived
        ? undefined
        : eq(serviceTemplates.status, ServiceTemplateStatus.Active),
    )
    .orderBy(desc(serviceTemplates.created_at));

  // rows already answers it, except the one case where an active-only query came back empty:
  // that could mean a truly empty catalog or one with only archived rows, so it re-checks unfiltered.
  let hasServiceTemplates = rows.length > 0;
  if (!hasServiceTemplates && !options.includeArchived) {
    const anyRow = await db
      .select({ id: serviceTemplates.id })
      .from(serviceTemplates)
      .limit(1);
    hasServiceTemplates = anyRow.length > 0;
  }

  return {
    hasServiceTemplates,
    rows: rows.map(serviceTemplatesMapperService.toDto),
  };
}
