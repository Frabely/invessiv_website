import "server-only";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { ServiceTemplateErrorCode } from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import type { UpdateServiceTemplateRequestDto } from "@invessiv/common/contracts/crm/update-service-template-request.dto";
import type { UpdateServiceTemplateResult } from "@invessiv/common/contracts/crm/results/update-service-template-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { serviceTemplates } from "@invessiv/db/record-configuration";
import { serviceTemplateSchemas } from "@/server/workspace/crm/services/service-template-schemas";
import { serviceTemplatesMapperService } from "@/server/workspace/crm/services/service-templates-mapper-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

export async function updateServiceTemplate(
  serviceTemplateId: string,
  input: UpdateServiceTemplateRequestDto,
): Promise<UpdateServiceTemplateResult> {
  // An id that is not a UUID at all can never match a row; treated the same as a missing one.
  if (!serviceTemplateSchemas.entityId.safeParse(serviceTemplateId).success) {
    return {
      ok: false,
      code: ServiceTemplateErrorCode.ServiceTemplateNotFound,
    };
  }

  const validation = serviceTemplateSchemas.update.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: ServiceTemplateErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const data = validation.data;
  const db = getDrizzleDatabaseClient();
  const write = await db.transaction((tx) =>
    updateVersioned({
      tx,
      table: serviceTemplates,
      id: serviceTemplateId,
      expectedVersion: data.version,
      patch: {
        title: data.title,
        description: data.description,
        price_cents: data.priceCents,
        pricing_mode: data.pricingMode,
        recurring_interval: data.recurringInterval,
        status: data.status,
      },
      toDto: serviceTemplatesMapperService.toDto,
    }),
  );

  if (write.ok) {
    return { ok: true, serviceTemplate: write.value };
  }
  if (write.code === ConcurrencyErrorCode.NotFound) {
    return {
      ok: false,
      code: ServiceTemplateErrorCode.ServiceTemplateNotFound,
    };
  }
  return {
    ok: false,
    code: ConcurrencyErrorCode.VersionConflict,
    conflict: write.conflict,
  };
}
