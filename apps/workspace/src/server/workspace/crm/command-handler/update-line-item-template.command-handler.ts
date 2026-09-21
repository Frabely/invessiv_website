import "server-only";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import type { UpdateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/update-line-item-template-request.dto";
import type { UpdateLineItemTemplateResult } from "@invessiv/common/contracts/crm/results/update-line-item-template-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { lineItemTemplates } from "@invessiv/db/record-configuration";
import { lineItemTemplateSchemas } from "@/server/workspace/crm/services/line-item-template-schemas";
import { lineItemTemplatesMapperService } from "@/server/workspace/crm/services/line-item-templates-mapper-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

export async function updateLineItemTemplate(
  lineItemTemplateId: string,
  input: UpdateLineItemTemplateRequestDto,
): Promise<UpdateLineItemTemplateResult> {
  // An id that is not a UUID at all can never match a row; treated the same as a missing one.
  if (!lineItemTemplateSchemas.entityId.safeParse(lineItemTemplateId).success) {
    return {
      ok: false,
      code: LineItemTemplateErrorCode.LineItemTemplateNotFound,
    };
  }

  const validation = lineItemTemplateSchemas.update.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: LineItemTemplateErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const data = validation.data;
  const db = getDrizzleDatabaseClient();
  const write = await db.transaction((tx) =>
    updateVersioned({
      tx,
      table: lineItemTemplates,
      id: lineItemTemplateId,
      expectedVersion: data.version,
      patch: {
        title: data.title,
        description: data.description,
        price_cents: data.priceCents,
        pricing_mode: data.pricingMode,
        recurring_interval: data.recurringInterval,
        status: data.status,
      },
      toDto: lineItemTemplatesMapperService.toDto,
    }),
  );

  if (write.ok) {
    return { ok: true, lineItemTemplate: write.value };
  }
  if (write.code === ConcurrencyErrorCode.NotFound) {
    return {
      ok: false,
      code: LineItemTemplateErrorCode.LineItemTemplateNotFound,
    };
  }
  return {
    ok: false,
    code: ConcurrencyErrorCode.VersionConflict,
    conflict: write.conflict,
  };
}
