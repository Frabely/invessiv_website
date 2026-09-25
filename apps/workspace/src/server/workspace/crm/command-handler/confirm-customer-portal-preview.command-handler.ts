import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import type { ConfirmPortalPreviewRequestDto } from "@invessiv/common/contracts/crm/confirm-portal-preview-request.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";

type ConfirmDto = { version: number };
type ConfirmResult =
  | { ok: true; version: number }
  | {
      ok: false;
      code:
        | typeof PortalAccessErrorCode.NotFound
        | typeof PortalAccessErrorCode.ValidationError;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: {
        code: typeof ConcurrencyErrorCode.VersionConflict;
        currentVersion: number;
        current: ConfirmDto;
      };
    };

/** Records the mandatory, customer-scoped preview acknowledgement before the first invite. */
export async function confirmCustomerPortalPreview(
  customerId: string,
  input: ConfirmPortalPreviewRequestDto,
  actor: WorkspaceActor,
): Promise<ConfirmResult> {
  if (!isUuid(customerId))
    return { ok: false, code: PortalAccessErrorCode.NotFound };
  if (!input || !Number.isInteger(input.version) || input.version < 1)
    return { ok: false, code: PortalAccessErrorCode.ValidationError };
  if (!canOn(actor, Permission.PortalAccessManage, { customerId }))
    return { ok: false, code: PortalAccessErrorCode.NotFound };
  const now = new Date();
  const db = getDrizzleDatabaseClient();
  const result = await db.transaction((tx) =>
    updateVersioned({
      tx,
      table: customers,
      id: customerId,
      expectedVersion: input.version,
      patch: {
        portal_preview_confirmed_at: now,
        portal_preview_confirmed_by_member_id: actor.workspaceMemberId,
      },
      toDto: (row): ConfirmDto => ({ version: row.version }),
    }),
  );
  if (result.ok) return { ok: true, version: result.value.version };
  if (result.code === ConcurrencyErrorCode.VersionConflict) {
    return {
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: result.conflict,
    };
  }
  return { ok: false, code: PortalAccessErrorCode.NotFound };
}
