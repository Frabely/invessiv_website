import "server-only";

import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { lineItemTemplateReadService } from "@/server/workspace/crm/services/line-item-template-read-service";

/** Every active template, unpaginated: the project assignment picker needs the full catalog, not one page of it. */
export async function listAssignableLineItemTemplates(): Promise<
  LineItemTemplateDto[]
> {
  const db = getDrizzleDatabaseClient();
  return lineItemTemplateReadService.listRows(db, false);
}
