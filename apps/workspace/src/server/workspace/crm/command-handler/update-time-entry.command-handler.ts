import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { UpdateTimeEntryRequestDto } from "@invessiv/common/contracts/crm/hours/update-time-entry-request.dto";
import type { UpdateTimeEntryResult } from "@invessiv/common/contracts/crm/results/update-time-entry-result";
import type { TimeEntryRow } from "@invessiv/common/contracts/crm/rows/time-entry-row";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projectTimeEntries } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { businessToday } from "@/common/patterns/time/business-today";
import { hoursBalanceService } from "@/server/shared/services/hours/hours-balance-service";
import { hoursActivityService } from "@/server/workspace/crm/services/hours/hours-activity-service";
import { hoursMappingService } from "@/server/workspace/crm/services/hours/hours-mapping-service";
import { hoursSchemas } from "@/server/workspace/crm/services/hours/hours-schemas";
import { timeEntryAccessService } from "@/server/workspace/crm/services/hours/time-entry-access-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

/**
 * Edits day, duration, description, goodwill and task of a time entry. The project and the booking
 * member never change — a wrongly placed entry is deleted and booked again. Editing stays possible
 * on a closed project, because correcting what the customer reads must not depend on its status.
 */
export async function updateTimeEntry(
  timeEntryId: string,
  input: UpdateTimeEntryRequestDto,
  actor: WorkspaceActor,
): Promise<UpdateTimeEntryResult> {
  if (!hoursSchemas.entityId.safeParse(timeEntryId).success) {
    return { ok: false, code: HoursErrorCode.TimeEntryNotFound };
  }

  const today = businessToday();
  const validation = hoursSchemas.updateTimeEntry
    .refine((data) => data.performedOn <= today, { path: ["performedOn"] })
    .safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: HoursErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const db = getDrizzleDatabaseClient();
  const previous = await timeEntryAccessService.find(
    db,
    timeEntryId,
    actor,
    Permission.HoursWrite,
  );
  if (!previous) return { ok: false, code: HoursErrorCode.TimeEntryNotFound };

  const data = validation.data;
  // An unchanged link stays valid even after its task was cancelled; only a new link is checked.
  if (
    data.taskId &&
    data.taskId !== previous.task_id &&
    !(await timeEntryAccessService.isTaskLinkable(
      db,
      data.taskId,
      previous.project_id,
    ))
  ) {
    return { ok: false, code: HoursErrorCode.TaskNotLinkable };
  }

  return db.transaction(async (tx): Promise<UpdateTimeEntryResult> => {
    const write = await updateVersioned({
      tx,
      table: projectTimeEntries,
      id: timeEntryId,
      expectedVersion: data.version,
      patch: {
        task_id: data.taskId,
        performed_on: data.performedOn,
        duration_minutes: data.durationMinutes,
        description: data.description,
        billable: data.billable,
      },
      toDto: (row): TimeEntryRow => row,
    });

    if (!write.ok) {
      if (write.code === ConcurrencyErrorCode.NotFound) {
        return { ok: false, code: HoursErrorCode.TimeEntryNotFound };
      }
      return {
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          ...write.conflict,
          current: hoursMappingService.toTimeEntryDto(write.conflict.current),
        },
      };
    }

    // The version matched, so the row is exactly the one read above and the diff is accurate.
    await hoursActivityService.recordTimeEntryChanged(
      tx,
      previous,
      write.value,
      { type: ActorType.User, userId: actor.userId },
    );

    const balance = await hoursBalanceService.loadProjectBalance(
      tx,
      previous.customer_id,
      previous.project_id,
    );
    if (!balance) return { ok: false, code: HoursErrorCode.TimeEntryNotFound };
    return {
      ok: true,
      timeEntry: hoursMappingService.toTimeEntryDto(write.value),
      project: balance,
    };
  });
}
