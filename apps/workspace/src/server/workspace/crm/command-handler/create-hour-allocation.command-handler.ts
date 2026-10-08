import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HOURS_CLOSED_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/crm/hours-closed-project-statuses";
import type { CreateHourAllocationRequestDto } from "@invessiv/common/contracts/crm/hours/create-hour-allocation-request.dto";
import type { CreateHourAllocationResult } from "@invessiv/common/contracts/crm/results/create-hour-allocation-result";
import { computeProjectHoursBalance } from "@invessiv/common/patterns/crm/hours/hours-balance";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { hoursBalanceService } from "@/server/shared/services/hours/hours-balance-service";
import { hoursActivityService } from "@/server/workspace/crm/services/hours/hours-activity-service";
import { hoursLedgerService } from "@/server/workspace/crm/services/hours/hours-ledger-service";
import { hoursMappingService } from "@/server/workspace/crm/services/hours/hours-mapping-service";
import { hoursSchemas } from "@/server/workspace/crm/services/hours/hours-schemas";

/**
 * Moves hours between the customer's free stock and one project: positive minutes allocate,
 * negative minutes release. Nothing here ever balances an overdrawn project from another one —
 * a release hands back only what its own project has not used, and an allocation draws only from
 * hours that are free. The customer row is locked first so two writers never read the same sums.
 */
export async function createHourAllocation(
  customerId: string,
  input: CreateHourAllocationRequestDto,
  actor: WorkspaceActor,
): Promise<CreateHourAllocationResult> {
  if (!hoursSchemas.entityId.safeParse(customerId).success) {
    return { ok: false, code: HoursErrorCode.CustomerNotFound };
  }

  const validation = hoursSchemas.createAllocation.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: HoursErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }
  if (!canOn(actor, Permission.HoursManage, { customerId })) {
    return { ok: false, code: HoursErrorCode.CustomerNotFound };
  }

  const data = validation.data;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    if (!(await hoursLedgerService.lockCustomer(tx, customerId))) {
      return { ok: false, code: HoursErrorCode.CustomerNotFound };
    }

    const purchasedMinutes = await hoursBalanceService.loadPurchasedMinutes(
      tx,
      customerId,
    );
    const projectSums = await hoursBalanceService.loadProjectSums(
      tx,
      customerId,
    );
    // Only projects of this customer are in the list, so a foreign project is simply missing.
    const projectSum = projectSums.find(
      (candidate) => candidate.projectId === data.projectId,
    );
    if (!projectSum) {
      return { ok: false, code: HoursErrorCode.ProjectNotFound };
    }
    const balance = hoursBalanceService.toCustomerBalance(
      purchasedMinutes,
      projectSums,
    );
    const project = computeProjectHoursBalance(projectSum);

    // A repeated request is the same movement, not a second one.
    const existing = await hoursLedgerService.findAllocationByKey(
      tx,
      data.idempotencyKey,
    );
    if (existing) {
      if (
        existing.customer_id !== customerId ||
        existing.project_id !== data.projectId
      ) {
        return { ok: false, code: HoursErrorCode.ValidationError, errors: [] };
      }
      return {
        ok: true,
        allocation: hoursMappingService.toAllocationDto(existing),
        balance,
        project,
      };
    }

    if (data.minutes > 0) {
      if (HOURS_CLOSED_PROJECT_STATUS_VALUES.includes(projectSum.status)) {
        return { ok: false, code: HoursErrorCode.ProjectClosed };
      }
      if (data.minutes > balance.freeMinutes) {
        return {
          ok: false,
          code: HoursErrorCode.InsufficientFreeHours,
          balance,
          project,
        };
      }
    } else if (-data.minutes > project.releasableMinutes) {
      return {
        ok: false,
        code: HoursErrorCode.InsufficientReleasableHours,
        balance,
        project,
      };
    }

    const row = await hoursLedgerService.insertAllocation(tx, {
      customerId,
      projectId: data.projectId,
      minutes: data.minutes,
      note: data.note,
      idempotencyKey: data.idempotencyKey,
      createdByMemberId: actor.workspaceMemberId,
    });
    await hoursActivityService.recordAllocation(tx, row, {
      type: ActorType.User,
      userId: actor.userId,
    });

    const nextSums = projectSums.map((candidate) =>
      candidate.projectId === data.projectId
        ? {
            ...candidate,
            allocatedMinutes: candidate.allocatedMinutes + data.minutes,
          }
        : candidate,
    );
    return {
      ok: true,
      allocation: hoursMappingService.toAllocationDto(row),
      balance: hoursBalanceService.toCustomerBalance(
        purchasedMinutes,
        nextSums,
      ),
      project: computeProjectHoursBalance({
        ...projectSum,
        allocatedMinutes: projectSum.allocatedMinutes + data.minutes,
      }),
    };
  });
}
