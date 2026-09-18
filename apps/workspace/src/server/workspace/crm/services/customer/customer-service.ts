import "server-only";

import type { z } from "zod";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";
import type { ListCustomersResult } from "@invessiv/common/contracts/crm/results/list-customers-result";
import type { UpdateCustomerResult } from "@invessiv/common/contracts/crm/results/update-customer-result";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  customerContactAssignments,
  customers,
  people,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import {
  accessScope,
  customerBaseVisibilityIds,
} from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { CustomerListFilters } from "@/common/contracts/crm/customer-list-filters";
import { memberResponsibilityLockService } from "@/server/workspace/access/services/responsibilities/member-responsibility-lock-service";
import { customerCategoryService } from "@/server/workspace/crm/services/customer-category-service";
import { customerCategoryValidationService } from "@/server/workspace/crm/services/customer-category-validation-service";
import { customerContactService } from "@/server/workspace/crm/services/customer-contact/customer-contact-service";
import { customerConstraintViolationService } from "@/server/workspace/crm/services/customer-constraint-violation-service";
import { customerReadService } from "@/server/workspace/crm/services/customer-read-service";
import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";
import { customerWriteMappingService } from "@/server/workspace/crm/services/customer-write-mapping-service";
import { activityService } from "@/server/workspace/shared/services/activity-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

const CUSTOMER_LIST_PAGE_SIZE = 25;

type CustomerCreationInput = z.infer<typeof customerSchemas.create>;

type CustomerCreationResult =
  | { ok: true; customerId: string }
  | { ok: false; code: typeof CustomerErrorCode.OwnerInactive }
  | {
      ok: false;
      code: typeof CustomerErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    };

async function createCustomer(
  tx: ContactDatabaseTransaction,
  data: CustomerCreationInput,
  actor: WorkspaceActor,
): Promise<CustomerCreationResult> {
  const ownerIsActive =
    await memberResponsibilityLockService.lockActiveMemberForAssignment(
      tx,
      actor.workspaceMemberId,
    );
  if (!ownerIsActive) {
    return { ok: false, code: CustomerErrorCode.OwnerInactive };
  }

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

  const customerId = crypto.randomUUID();
  const primaryPersonId = crypto.randomUUID();
  await tx
    .insert(people)
    .values(
      customerWriteMappingService.mapContactApiToPersonDb(
        primaryPersonId,
        data.primaryContact,
      ),
    );
  await tx
    .insert(customers)
    .values(
      customerWriteMappingService.mapCreateCustomerApiToDb(
        customerId,
        data,
        actor.workspaceMemberId,
      ),
    );
  await tx
    .insert(customerContactAssignments)
    .values(
      customerWriteMappingService.mapContactApiToAssignmentDb(
        crypto.randomUUID(),
        customerId,
        primaryPersonId,
        data.primaryContact,
        true,
      ),
    );

  for (const contact of data.additionalContacts ?? []) {
    const personId = crypto.randomUUID();
    await tx
      .insert(people)
      .values(
        customerWriteMappingService.mapContactApiToPersonDb(personId, contact),
      );
    await tx
      .insert(customerContactAssignments)
      .values(
        customerWriteMappingService.mapContactApiToAssignmentDb(
          crypto.randomUUID(),
          customerId,
          personId,
          contact,
          false,
        ),
      );
  }

  return { ok: true, customerId };
}

async function updateCustomer(
  customerId: string,
  input: UpdateCustomerRequestDto,
  actor: WorkspaceActor,
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
  if (
    !canOn(actor, Permission.CustomersRead, { customerId }) ||
    !canOn(actor, Permission.CustomersWrite, { customerId })
  ) {
    return { ok: false, code: CustomerErrorCode.CustomerNotFound };
  }
  const db = getDrizzleDatabaseClient();
  try {
    return await db.transaction(async (tx): Promise<UpdateCustomerResult> => {
      const previousStatus = await customerReadService.findStatusById(
        tx,
        customerId,
      );
      if (!previousStatus) {
        return { ok: false, code: CustomerErrorCode.CustomerNotFound };
      }
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
      if (!write.ok) {
        return createCustomerUpdateFailureResult(tx, customerId, write.code);
      }
      if (data.contacts) {
        await customerContactService.synchronizeCustomerContacts(
          tx,
          customerId,
          data.contacts,
        );
      }
      if (previousStatus !== data.status) {
        await activityService.createActivity(tx, {
          customerId,
          type: ActivityType.StatusChange,
          body: `${previousStatus} → ${data.status}`,
          metadata: {
            previous_status: previousStatus,
            next_status: data.status,
          },
          actor: { type: ActorType.User, userId: actor.userId },
        });
      }
      const customer = await customerReadService.findDetailById(tx, customerId);
      if (!customer) {
        return { ok: false, code: CustomerErrorCode.CustomerNotFound };
      }
      return { ok: true, customer };
    });
  } catch (error: unknown) {
    if (customerContactService.isContactWriteConflict(error)) {
      return createCustomerVersionConflictResult(db, customerId);
    }
    if (customerConstraintViolationService.isDisplayNameTaken(error)) {
      return { ok: false, code: CustomerErrorCode.DisplayNameTaken };
    }
    throw error;
  }
}

async function getCustomer(
  customerId: string,
  actor: WorkspaceActor,
  includeSourceLeads = false,
): Promise<CustomerDetailDto | null> {
  if (!customerSchemas.entityId.safeParse(customerId).success) {
    return null;
  }

  return customerReadService.findDetailById(
    getDrizzleDatabaseClient(),
    customerId,
    includeSourceLeads,
    accessScope(actor, Permission.CustomersRead),
  );
}

async function searchCustomers(
  filters: CustomerListFilters,
  actor: WorkspaceActor,
): Promise<ListCustomersResult> {
  const db = getDrizzleDatabaseClient();
  const scope = accessScope(actor, Permission.CustomersRead);
  const baseCustomerIds = customerBaseVisibilityIds(actor);
  const total = await customerReadService.countSummaries(
    db,
    filters,
    scope,
    baseCustomerIds,
  );
  const hasCustomers =
    total > 0 ||
    (await customerReadService.countSummaries(
      db,
      {
        ...filters,
        includeArchived: true,
        search: "",
      },
      scope,
      baseCustomerIds,
    )) > 0;
  const totalPages = Math.max(1, Math.ceil(total / CUSTOMER_LIST_PAGE_SIZE));
  const page = total > 0 ? Math.min(filters.page, totalPages) : 1;
  const rows = await customerReadService.listSummaries(
    db,
    { ...filters, page },
    CUSTOMER_LIST_PAGE_SIZE,
    scope,
    baseCustomerIds,
  );

  return {
    hasCustomers,
    page,
    perPage: CUSTOMER_LIST_PAGE_SIZE,
    rows,
    total,
  };
}

async function createCustomerUpdateFailureResult(
  executor: Parameters<typeof customerReadService.findDetailById>[0],
  customerId: string,
  code: ConcurrencyErrorCode,
): Promise<UpdateCustomerResult> {
  if (code === ConcurrencyErrorCode.NotFound) {
    return { ok: false, code: CustomerErrorCode.CustomerNotFound };
  }
  return createCustomerVersionConflictResult(executor, customerId);
}

async function createCustomerVersionConflictResult(
  executor: Parameters<typeof customerReadService.findDetailById>[0],
  customerId: string,
): Promise<UpdateCustomerResult> {
  const current = await customerReadService.findDetailById(
    executor,
    customerId,
  );
  if (!current) {
    return { ok: false, code: CustomerErrorCode.CustomerNotFound };
  }
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

export const customerService = {
  create: createCustomer,
  get: getCustomer,
  search: searchCustomers,
  update: updateCustomer,
} as const;
