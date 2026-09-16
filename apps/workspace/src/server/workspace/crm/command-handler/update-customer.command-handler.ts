import "server-only";

import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";
import type { UpdateCustomerResult } from "@invessiv/common/contracts/crm/results/update-customer-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers } from "@invessiv/db/record-configuration";
import { customerCategoryService } from "@/server/workspace/crm/services/customer-category-service";
import { customerConstraintViolationService } from "@/server/workspace/crm/services/customer-constraint-violation-service";
import { customerReadService } from "@/server/workspace/crm/services/customer-read-service";
import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";
import { customerWriteMappingService } from "@/server/workspace/crm/services/customer-write-mapping-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerRequestDto,
): Promise<UpdateCustomerResult> {
  if (!customerSchemas.entityId.safeParse(customerId).success) {
    return { ok: false, code: CustomerErrorCode.CustomerNotFound };
  }

  const validation = customerSchemas.update.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: CustomerErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const data = validation.data;
  const db = getDrizzleDatabaseClient();

  try {
    return await db.transaction(async (tx): Promise<UpdateCustomerResult> => {
      if (
        data.categoryId &&
        !(await customerCategoryService.isActive(tx, data.categoryId))
      ) {
        return {
          ok: false,
          code: CustomerErrorCode.ValidationError,
          errors: [
            {
              code: "custom",
              input: data.categoryId,
              message: "Unknown or inactive category",
              path: ["categoryId"],
            },
          ],
        };
      }

      // The contacts live in other tables, so the DTO is read after the atomic write
      // instead of being mapped from the updated row.
      const write = await updateVersioned({
        tx,
        table: customers,
        id: customerId,
        expectedVersion: data.version,
        patch: customerWriteMappingService.mapUpdateCustomerApiToDb(data),
        toDto: (row) => row.id,
      });

      if (!write.ok && write.code === ConcurrencyErrorCode.NotFound) {
        return { ok: false, code: CustomerErrorCode.CustomerNotFound };
      }

      const customer = await customerReadService.findDetailById(tx, customerId);
      if (!customer) {
        return { ok: false, code: CustomerErrorCode.CustomerNotFound };
      }
      if (!write.ok) {
        return {
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          conflict: {
            code: ConcurrencyErrorCode.VersionConflict,
            currentVersion: customer.version,
            current: customer,
          },
        };
      }

      return { ok: true, customer };
    });
  } catch (error: unknown) {
    if (customerConstraintViolationService.isDisplayNameTaken(error)) {
      return { ok: false, code: CustomerErrorCode.DisplayNameTaken };
    }
    throw error;
  }
}
