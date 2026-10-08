import "server-only";

import { eq } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";
import type { DeleteTimeEntryResult } from "@invessiv/common/contracts/crm/results/delete-time-entry-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projectTimeEntries } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { hoursBalanceService } from "@/server/shared/services/hours/hours-balance-service";
import { hoursActivityService } from "@/server/workspace/crm/services/hours/hours-activity-service";
import { hoursMappingService } from "@/server/workspace/crm/services/hours/hours-mapping-service";
import { hoursSchemas } from "@/server/workspace/crm/services/hours/hours-schemas";
import { timeEntryAccessService } from "@/server/workspace/crm/services/hours/time-entry-access-service";
import { versionConflict } from "@/server/workspace/shared/version-conflict";

/**
 * Removes a time entry. A delete is a write like any other: the row is locked, its version is
 * compared under the lock, and the figures that mattered are kept with the activity.
 */
export async function deleteTimeEntry(
  timeEntryId: string,
  input: VersionedWriteInput,
  actor: WorkspaceActor,
): Promise<DeleteTimeEntryResult> {
  if (!hoursSchemas.entityId.safeParse(timeEntryId).success) {
    return { ok: false, code: HoursErrorCode.TimeEntryNotFound };
  }
  const validation = hoursSchemas.deleteTimeEntry.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: HoursErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  return getDrizzleDatabaseClient().transaction(
    async (tx): Promise<DeleteTimeEntryResult> => {
      const row = await timeEntryAccessService.lock(
        tx,
        timeEntryId,
        actor,
        Permission.HoursWrite,
      );
      if (!row) return { ok: false, code: HoursErrorCode.TimeEntryNotFound };
      if (row.version !== validation.data.version) {
        return versionConflict(
          row.version,
          hoursMappingService.toTimeEntryDto(row),
        );
      }

      await hoursActivityService.recordTimeEntryDeleted(tx, row, {
        type: ActorType.User,
        userId: actor.userId,
      });
      await tx
        .delete(projectTimeEntries)
        .where(eq(projectTimeEntries.id, row.id));

      const balance = await hoursBalanceService.loadProjectBalance(
        tx,
        row.customer_id,
        row.project_id,
      );
      if (!balance)
        return { ok: false, code: HoursErrorCode.TimeEntryNotFound };
      return { ok: true, deleted: true, project: balance };
    },
  );
}
