import "server-only";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { ServiceRequestErrorCode as E } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestTransitionSide } from "@invessiv/common/constants/crm/service-request-transition-sides";
import type { ChangeServiceRequestStatusRequestDto } from "@invessiv/common/contracts/crm/service-requests/change-service-request-status-request.dto";
import type { ChangeServiceRequestStatusResult } from "@invessiv/common/contracts/crm/results/change-service-request-status-result";
import { canTransitionServiceRequest } from "@invessiv/common/patterns/crm/service-request-state";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { serviceRequests } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { serviceRequestEventService } from "@/server/shared/services/service-request/service-request-event-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import { serviceRequestAccessService as access } from "../services/service-requests/service-request-access-service";
import { serviceRequestSchemas } from "../services/service-requests/service-request-schemas";

export async function changeServiceRequestStatus(
  id: string,
  input: ChangeServiceRequestStatusRequestDto,
  actor: WorkspaceActor,
): Promise<ChangeServiceRequestStatusResult> {
  if (!serviceRequestSchemas.entityId.safeParse(id).success)
    return { ok: false, code: E.ServiceRequestNotFound };
  const parsed = serviceRequestSchemas.changeStatus.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.ValidationError };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const request = await access.lock(tx, id, actor);
    if (!request) return { ok: false, code: E.ServiceRequestNotFound };
    if (
      !canTransitionServiceRequest(
        request.status,
        parsed.data.to,
        ServiceRequestTransitionSide.Internal,
      )
    )
      return { ok: false, code: E.InvalidTransition };
    if (request.version !== parsed.data.version)
      return {
        ok: false,
        code: E.VersionConflict,
        conflict: {
          code: ConcurrencyErrorCode.VersionConflict,
          currentVersion: request.version,
          current: await access.toDto(tx, request, actor),
        },
      };
    const patch =
      parsed.data.to === S.Offered
        ? { status: S.Offered, offered_at: new Date() }
        : {
            status: S.Declined,
            decline_reason: parsed.data.reason,
            decided_at: new Date(),
            decided_by_member_id: actor.workspaceMemberId,
          };
    const changed = await updateLockedVersioned(
      {
        tx,
        table: serviceRequests,
        id,
        expectedVersion: request.version,
        patch,
      },
      "Locked service request changed",
    );
    await serviceRequestEventService.record(
      tx,
      changed,
      { type: ActorType.User, userId: actor.userId },
      request.status,
    );
    return { ok: true, request: await access.toDto(tx, changed, actor) };
  });
}
