import "server-only";

import { ServiceTemplateErrorCode } from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import type { CreateServiceTemplateRequestDto } from "@invessiv/common/contracts/crm/create-service-template-request.dto";
import type { CreateServiceTemplateResult } from "@invessiv/common/contracts/crm/results/create-service-template-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { serviceTemplates } from "@invessiv/db/record-configuration";
import { serviceTemplateSchemas } from "@/server/workspace/crm/services/service-template-schemas";
import { serviceTemplatesMapperService } from "@/server/workspace/crm/services/service-templates-mapper-service";

export async function createServiceTemplate(
  input: CreateServiceTemplateRequestDto,
): Promise<CreateServiceTemplateResult> {
  const validation = serviceTemplateSchemas.create.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: ServiceTemplateErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const data = validation.data;
  const [row] = await getDrizzleDatabaseClient()
    .insert(serviceTemplates)
    .values({
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      price_cents: data.priceCents,
      pricing_mode: data.pricingMode,
      recurring_interval: data.recurringInterval,
      status: ServiceTemplateStatus.Active,
      version: 1,
    })
    .returning();

  return {
    ok: true,
    serviceTemplate: serviceTemplatesMapperService.toDto(row),
  };
}
