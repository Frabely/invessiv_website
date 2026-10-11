import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";
import type { CreateHourPurchaseRequestDto } from "@invessiv/common/contracts/crm/hours/create-hour-purchase-request.dto";
import type { CreateHourPurchaseResult } from "@invessiv/common/contracts/crm/results/create-hour-purchase-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { businessToday } from "@/common/patterns/time/business-today";
import { hoursBalanceService } from "@/server/shared/services/hours/hours-balance-service";
import { hoursActivityService } from "@/server/workspace/crm/services/hours/hours-activity-service";
import { hoursLedgerService } from "@/server/workspace/crm/services/hours/hours-ledger-service";
import { hoursMappingService } from "@/server/workspace/crm/services/hours/hours-mapping-service";
import { hoursSchemas } from "@/server/workspace/crm/services/hours/hours-schemas";

/**
 * Records purchased hours, or corrects them downwards. The customer row is locked before the sums
 * are read, so a correction can never race an allocation below what is already allocated. A
 * customer the actor may not manage answers like a missing one.
 */
export async function createHourPurchase(
  customerId: string,
  input: CreateHourPurchaseRequestDto,
  actor: WorkspaceActor,
): Promise<CreateHourPurchaseResult> {
  if (!hoursSchemas.entityId.safeParse(customerId).success) {
    return { ok: false, code: HoursErrorCode.CustomerNotFound };
  }

  const today = businessToday();
  const validation = hoursSchemas.createPurchase
    .refine((data) => data.purchasedOn <= today, { path: ["purchasedOn"] })
    .safeParse(input);
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
    const balance = hoursBalanceService.toCustomerBalance(
      purchasedMinutes,
      projectSums,
    );

    // A repeated request is the same purchase, not a second one.
    const existing = await hoursLedgerService.findPurchaseByKey(
      tx,
      data.idempotencyKey,
    );
    if (existing) {
      if (existing.customer_id !== customerId) {
        return { ok: false, code: HoursErrorCode.ValidationError, errors: [] };
      }
      return {
        ok: true,
        purchase: hoursMappingService.toPurchaseDto(existing),
        balance,
      };
    }

    if (balance.purchasedMinutes + data.minutes < balance.allocatedMinutes) {
      return { ok: false, code: HoursErrorCode.BelowAllocatedHours, balance };
    }

    const row = await hoursLedgerService.insertPurchase(tx, {
      customerId,
      kind: data.kind,
      source: HourPurchaseSource.Manual,
      minutes: data.minutes,
      purchasedOn: data.purchasedOn,
      note: data.note,
      idempotencyKey: data.idempotencyKey,
      createdByMemberId: actor.workspaceMemberId,
    });
    await hoursActivityService.recordPurchase(tx, row, {
      type: ActorType.User,
      userId: actor.userId,
    });

    return {
      ok: true,
      purchase: hoursMappingService.toPurchaseDto(row),
      balance: hoursBalanceService.toCustomerBalance(
        purchasedMinutes + data.minutes,
        projectSums,
      ),
    };
  });
}
