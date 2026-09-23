import "server-only";

import type { ListLineItemTemplatesResult } from "@invessiv/common/contracts/crm/results/list-line-item-templates-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { LineItemTemplateListFilters } from "@/common/contracts/crm/line-item-template-list-filters";
import { lineItemTemplateReadService } from "@/server/workspace/crm/services/line-item-template-read-service";

const LINE_ITEM_TEMPLATE_LIST_PAGE_SIZE = 25;

export async function listLineItemTemplates(
  filters: LineItemTemplateListFilters,
): Promise<ListLineItemTemplatesResult> {
  const db = getDrizzleDatabaseClient();

  const total = await lineItemTemplateReadService.countRows(
    db,
    filters.includeArchived,
  );
  // rows already answers it, except the one case where an active-only query came back empty:
  // that could mean a truly empty catalog or one with only archived rows, so it re-checks unfiltered.
  const hasLineItemTemplates =
    total > 0 ||
    (!filters.includeArchived &&
      (await lineItemTemplateReadService.countRows(db, true)) > 0);
  const totalPages = Math.max(
    1,
    Math.ceil(total / LINE_ITEM_TEMPLATE_LIST_PAGE_SIZE),
  );
  const page = total > 0 ? Math.min(Math.max(filters.page, 1), totalPages) : 1;
  const rows = await lineItemTemplateReadService.listRows(
    db,
    filters.includeArchived,
    {
      limit: LINE_ITEM_TEMPLATE_LIST_PAGE_SIZE,
      offset: (page - 1) * LINE_ITEM_TEMPLATE_LIST_PAGE_SIZE,
    },
  );

  return {
    hasLineItemTemplates,
    page,
    perPage: LINE_ITEM_TEMPLATE_LIST_PAGE_SIZE,
    rows,
    total,
  };
}
