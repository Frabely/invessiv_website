import "server-only";
import { and, eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestTransitionSide } from "@invessiv/common/constants/crm/service-request-transition-sides";
import { PortalServiceRequestErrorCode as E } from "@invessiv/common/constants/portal/portal-service-request-error-codes";
import type { WithdrawPortalServiceRequestResult } from "@invessiv/common/contracts/portal/results/withdraw-portal-service-request-result";
import { canTransitionServiceRequest } from "@invessiv/common/patterns/crm/service-request-state";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { serviceRequests } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalServiceRequestSchemas } from "@/server/portal/services/service-requests/portal-service-request-schemas";
import { portalServiceRequestService as services } from "@/server/portal/services/service-requests/portal-service-request-service";
import { serviceRequestEventService } from "@/server/shared/services/service-request/service-request-event-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";

/**
 * A contact takes back a request the team has not started on. Every miss — foreign company,
 * guessed id, missing right — answers the same `not_found`. A second call on a withdrawn request
 * succeeds without writing, so a double click leaves one event.
 */
export async function withdrawPortalServiceRequest(
  actor: PortalActor,
  requestId: string,
): Promise<WithdrawPortalServiceRequestResult> {
  if (!portalServiceRequestSchemas.id.safeParse(requestId).success)
    return { ok: false, code: E.NotFound };

  return getDrizzleDatabaseClient().transaction(
    async (tx): Promise<WithdrawPortalServiceRequestResult> => {
      const [request] = await tx
        .select()
        .from(serviceRequests)
        .where(
          and(
            eq(serviceRequests.id, requestId),
            services.requestCondition(actor, Permission.PortalServicesRequest),
          ),
        )
        .limit(1)
        .for("update");
      if (!request) return { ok: false, code: E.NotFound };
      if (request.status === ServiceRequestStatus.Withdrawn)
        return { ok: true, alreadyWithdrawn: true };
      if (
        !canTransitionServiceRequest(
          request.status,
          ServiceRequestStatus.Withdrawn,
          ServiceRequestTransitionSide.Customer,
        )
      )
        return { ok: false, code: E.Locked };

      const withdrawn = await updateLockedVersioned(
        {
          tx,
          table: serviceRequests,
          id: request.id,
          expectedVersion: request.version,
          patch: {
            status: ServiceRequestStatus.Withdrawn,
            decided_at: new Date(),
          },
        },
        "Locked service request changed",
      );
      await serviceRequestEventService.record(
        tx,
        withdrawn,
        portalActivityActor(actor),
        request.status,
      );
      return { ok: true, alreadyWithdrawn: false };
    },
  );
}
