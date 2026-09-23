import "server-only";

import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { lineItemTemplateReadService } from "@/server/workspace/crm/services/line-item-template-read-service";

/** Archived templates stay addressable; an unknown or malformed id is `null`, never a throw. */
export async function getLineItemTemplateById(
  lineItemTemplateId: string,
): Promise<LineItemTemplateDto | null> {
  if (!isUuid(lineItemTemplateId)) {
    return null;
  }

  return lineItemTemplateReadService.findById(
    getDrizzleDatabaseClient(),
    lineItemTemplateId,
  );
}
