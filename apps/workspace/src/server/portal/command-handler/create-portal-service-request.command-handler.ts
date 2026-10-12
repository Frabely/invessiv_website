import "server-only";
import { and, count, eq, inArray } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import {
  OPEN_SERVICE_REQUEST_STATUS_VALUES,
  ServiceRequestStatus,
} from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { PortalServiceRequestErrorCode as E } from "@invessiv/common/constants/portal/portal-service-request-error-codes";
import { PortalServiceRequestLimits } from "@invessiv/common/constants/portal/portal-service-request-limits";
import type { CreatePortalServiceRequestDto } from "@invessiv/common/contracts/portal/create-portal-service-request.dto";
import type { CreatePortalServiceRequestResult } from "@invessiv/common/contracts/portal/results/create-portal-service-request-result";
import {
  getDrizzleDatabaseClient,
  type ContactDatabaseTransaction,
} from "@invessiv/db/core";
import {
  customers,
  lineItemTemplates,
  serviceRequests,
} from "@invessiv/db/record-configuration";
import { listPortalServiceProjectWishes } from "@/common/patterns/portal/portal-service-project-wishes";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalServiceRequestSchemas } from "@/server/portal/services/service-requests/portal-service-request-schemas";
import { portalServiceRequestService as services } from "@/server/portal/services/service-requests/portal-service-request-service";
import { serviceRequestEventService } from "@/server/shared/services/service-request/service-request-event-service";

function failure(code: E): CreatePortalServiceRequestResult {
  return { ok: false, code };
}

/** Also used after an insert conflict: company locks do not serialize a key used by two companies. */
async function findRepeatedResult(
  tx: ContactDatabaseTransaction,
  customerId: string,
  idempotencyKey: string,
): Promise<CreatePortalServiceRequestResult | null> {
  const [repeated] = await tx
    .select({ id: serviceRequests.id, customerId: serviceRequests.customer_id })
    .from(serviceRequests)
    .where(eq(serviceRequests.idempotency_key, idempotencyKey))
    .limit(1);
  if (!repeated) return null;
  return repeated.customerId === customerId
    ? { ok: true, requestId: repeated.id }
    : failure(E.Validation);
}

/**
 * A contact asks for a service: a released catalog entry or free text. The company comes from the
 * actor, title and kind of a catalog request from the catalog row, never from the request.
 *
 * The customer row is locked, so parallel requests can neither pass the bound on open requests
 * nor ask twice for a further feedback round on the same project. A project the service cannot be
 * requested for answers `validation` — the same for a foreign, a hidden and an unknown id.
 */
export async function createPortalServiceRequest(
  actor: PortalActor,
  input: CreatePortalServiceRequestDto,
): Promise<CreatePortalServiceRequestResult> {
  if (!services.can(actor, Permission.PortalServicesRequest))
    return failure(E.NotFound);
  const parsed = portalServiceRequestSchemas.create.safeParse(input);
  if (!parsed.success) return failure(E.Validation);
  const data = parsed.data;

  return getDrizzleDatabaseClient().transaction(
    async (tx): Promise<CreatePortalServiceRequestResult> => {
      // `NO KEY UPDATE`: serialises requests per company without blocking foreign-key checks of
      // unrelated inserts.
      await tx
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, actor.customerId))
        .for("no key update");

      const repeated = await findRepeatedResult(
        tx,
        actor.customerId,
        data.idempotencyKey,
      );
      if (repeated) return repeated;

      const [open] = await tx
        .select({ total: count() })
        .from(serviceRequests)
        .where(
          and(
            eq(serviceRequests.customer_id, actor.customerId),
            inArray(serviceRequests.status, OPEN_SERVICE_REQUEST_STATUS_VALUES),
          ),
        );
      if ((open?.total ?? 0) >= PortalServiceRequestLimits.OpenPerCustomer)
        return failure(E.LimitReached);

      let service: {
        id: string;
        title: string;
        kind: LineItemKind;
        projectMode: LineItemProjectMode;
      } | null = null;
      if (data.lineItemTemplateId !== null) {
        const [template] = await tx
          .select({
            id: lineItemTemplates.id,
            title: lineItemTemplates.title,
            kind: lineItemTemplates.kind,
            projectMode: lineItemTemplates.project_mode,
          })
          .from(lineItemTemplates)
          .where(
            and(
              eq(lineItemTemplates.id, data.lineItemTemplateId),
              services.catalogCondition(),
            ),
          )
          .limit(1);
        if (!template) return failure(E.NotFound);
        if (data.title !== null) return failure(E.Validation);
        service = {
          id: template.id,
          title: template.title,
          kind: template.kind ?? LineItemKind.Standard,
          projectMode:
            template.projectMode ?? LineItemProjectMode.ExistingProject,
        };
      } else if (data.title === null || data.note === "") {
        return failure(E.Validation);
      }
      const kind = service?.kind ?? LineItemKind.Standard;
      const title = service?.title ?? data.title;
      if (title === null) return failure(E.Validation);

      if ((data.requestedMinutes !== null) !== (kind === LineItemKind.Hours))
        return failure(E.Validation);

      const selectable =
        service?.projectMode === LineItemProjectMode.NewProject
          ? []
          : await services.selectableProjects(
              tx,
              actor,
              Permission.PortalServicesRequest,
              kind,
              false,
            );
      const allowedWishes = listPortalServiceProjectWishes({
        service,
        selectableProjectCount: selectable.length,
      });
      if (
        !allowedWishes.includes(data.projectWish) ||
        (data.projectWish === ServiceRequestProjectWish.Existing &&
          !selectable.some((project) => project.id === data.projectId))
      )
        return failure(E.Validation);

      // Only an authorized, eligible project may reveal that another round was already requested.
      if (
        kind === LineItemKind.FeedbackRound &&
        data.projectId !== null &&
        (await services.openExtraRoundProjectIds(tx, actor.customerId)).has(
          data.projectId,
        )
      )
        return failure(E.DuplicateOpen);

      const [request] = await tx
        .insert(serviceRequests)
        .values({
          id: crypto.randomUUID(),
          customer_id: actor.customerId,
          line_item_template_id: service?.id ?? null,
          kind,
          title,
          note: data.note,
          requested_minutes: data.requestedMinutes,
          project_wish: data.projectWish,
          requested_project_id: data.projectId,
          requested_by_membership_id: actor.membershipId,
          status: ServiceRequestStatus.Requested,
          decline_reason: null,
          offered_at: null,
          decided_at: null,
          decided_by_member_id: null,
          project_id: null,
          project_line_item_id: null,
          idempotency_key: data.idempotencyKey,
          version: 1,
        })
        .onConflictDoNothing({ target: serviceRequests.idempotency_key })
        .returning();
      if (!request) {
        const conflicting = await findRepeatedResult(
          tx,
          actor.customerId,
          data.idempotencyKey,
        );
        if (conflicting) return conflicting;
        throw new Error("Conflicting service request disappeared");
      }

      await serviceRequestEventService.record(
        tx,
        request,
        portalActivityActor(actor),
        null,
      );
      return { ok: true, requestId: request.id };
    },
  );
}
