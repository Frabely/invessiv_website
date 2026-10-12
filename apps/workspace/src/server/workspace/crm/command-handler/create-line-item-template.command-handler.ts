import { insertLineItemTemplate } from "@/server/workspace/crm/services/insert-line-item-template";
import "server-only";

import { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import type { CreateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/create-line-item-template-request.dto";
import type { CreateLineItemTemplateResult } from "@invessiv/common/contracts/crm/results/create-line-item-template-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { lineItemTemplateSchemas } from "@/server/workspace/crm/services/line-item-template-schemas";
import { lineItemTemplatesMapperService } from "@/server/workspace/crm/services/line-item-templates-mapper-service";

export async function createLineItemTemplate(
  input: CreateLineItemTemplateRequestDto,
): Promise<CreateLineItemTemplateResult> {
  const validation = lineItemTemplateSchemas.create.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: LineItemTemplateErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const data = validation.data;
  const row = await insertLineItemTemplate(getDrizzleDatabaseClient(), data);

  return {
    ok: true,
    lineItemTemplate: lineItemTemplatesMapperService.toDto(row),
  };
}
