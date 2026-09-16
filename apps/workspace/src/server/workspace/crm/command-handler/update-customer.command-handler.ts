import "server-only";

import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";
import type { UpdateCustomerResult } from "@invessiv/common/contracts/crm/results/update-customer-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers } from "@invessiv/db/record-configuration";
import { customerCategoryService } from "@/server/workspace/crm/services/customer-category-service";
import { customerCategoryValidationService } from "@/server/workspace/crm/services/customer-category-validation-service";
import { customerContactWriteService } from "@/server/workspace/crm/services/customer-contact-write-service";
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
            customerCategoryValidationService.createUnknownOrInactiveCategoryIssue(
              data.categoryId,
            ),
          ],
        };
      }
      const write = await updateVersioned({
        tx,
        table: customers,
        id: customerId,
        expectedVersion: data.version,
        patch: customerWriteMappingService.mapUpdateCustomerApiToDb(data),
        toDto: (row) => row.id,
      });
      if (!write.ok)
        return await createCustomerUpdateFailureResult(
          tx,
          customerId,
          write.code,
        );
      if (data.contacts)
        await customerContactWriteService.synchronizeCustomerContacts(
          tx,
          customerId,
          data.contacts,
        );
      const customer = await customerReadService.findDetailById(tx, customerId);
      if (!customer)
        return { ok: false, code: CustomerErrorCode.CustomerNotFound };
      return { ok: true, customer };
    });
  } catch (error: unknown) {
    if (customerContactWriteService.isContactWriteConflict(error))
      return await createCustomerVersionConflictResult(db, customerId);
    if (customerConstraintViolationService.isDisplayNameTaken(error))
      return {
        ok: false,
        code: CustomerErrorCode.DisplayNameTaken,
      };
    throw error;
  }
}

async function createCustomerUpdateFailureResult(
  executor: Parameters<typeof customerReadService.findDetailById>[0],
  customerId: string,
  code: ConcurrencyErrorCode,
): Promise<UpdateCustomerResult> {
  if (code === ConcurrencyErrorCode.NotFound)
    return { ok: false, code: CustomerErrorCode.CustomerNotFound };
  return await createCustomerVersionConflictResult(executor, customerId);
}

async function createCustomerVersionConflictResult(
  executor: Parameters<typeof customerReadService.findDetailById>[0],
  customerId: string,
): Promise<UpdateCustomerResult> {
  const current = await customerReadService.findDetailById(
    executor,
    customerId,
  );
  if (!current) return { ok: false, code: CustomerErrorCode.CustomerNotFound };
  return {
    ok: false,
    code: ConcurrencyErrorCode.VersionConflict,
    conflict: {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: current.version,
      current,
    },
  };
}
