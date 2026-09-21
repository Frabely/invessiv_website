import "server-only";

import { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { CreateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/create-line-item-template-request.dto";
import type { CreateLineItemTemplateResult } from "@invessiv/common/contracts/crm/results/create-line-item-template-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { lineItemTemplates } from "@invessiv/db/record-configuration";
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
  const [row] = await getDrizzleDatabaseClient()
    .insert(lineItemTemplates)
    .values({
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      price_cents: data.priceCents,
      pricing_mode: data.pricingMode,
      recurring_interval: data.recurringInterval,
      status: LineItemTemplateStatus.Active,
      version: 1,
    })
    .returning();

  return {
    ok: true,
    lineItemTemplate: lineItemTemplatesMapperService.toDto(row),
  };
}
