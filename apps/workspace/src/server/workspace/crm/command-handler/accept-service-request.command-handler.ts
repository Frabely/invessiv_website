import "server-only";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { and, eq } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { ServiceRequestErrorCode as E } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { ServiceRequestTransitionSide } from "@invessiv/common/constants/crm/service-request-transition-sides";
import type { AcceptServiceRequestRequestDto } from "@invessiv/common/contracts/crm/service-requests/accept-service-request-request.dto";
import type { ChangeServiceRequestStatusResult } from "@invessiv/common/contracts/crm/results/change-service-request-status-result";
import { ProjectLineItemErrorCode as A } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import {
  canTransitionServiceRequest,
  isServiceRequestWithoutOffer,
} from "@invessiv/common/patterns/crm/service-request-state";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  serviceRequests,
  lineItemTemplates,
  projects,
  customers,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { AssignProjectLineItemFailureCode } from "@/common/contracts/crm/assign-project-line-item-failure-code";
import { canOn } from "@/common/patterns/auth/can-on";
import { serviceRequestEventService } from "@/server/shared/services/service-request/service-request-event-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import { serviceRequestAccessService as access } from "../services/service-requests/service-request-access-service";
import { serviceRequestSchemas } from "../services/service-requests/service-request-schemas";
import { projectLineItemAssignmentService } from "../services/project-line-item-assignment-service";
import { insertProject } from "../services/insert-project";
import { insertLineItemTemplate } from "../services/insert-line-item-template";

/** What an assignment refuses keeps its meaning for the request; a new code fails to compile here. */
const ASSIGNMENT_FAILURE: Record<AssignProjectLineItemFailureCode, E> = {
  [A.ValidationError]: E.ValidationError,
  [A.ProjectNotFound]: E.ProjectNotFound,
  [A.EffectNotPermitted]: E.EffectNotPermitted,
  [A.ProjectClosed]: E.ProjectClosed,
  [A.FeedbackRoundNotAvailable]: E.FeedbackRoundNotAvailable,
};

class AcceptanceFailure extends Error {
  constructor(readonly result: ChangeServiceRequestStatusResult) {
    super("Service request acceptance rolled back");
  }
}
function fail(code: E): never {
  throw new AcceptanceFailure({ ok: false, code });
}

export async function acceptServiceRequest(
  id: string,
  input: AcceptServiceRequestRequestDto,
  actor: WorkspaceActor,
): Promise<ChangeServiceRequestStatusResult> {
  if (!serviceRequestSchemas.entityId.safeParse(id).success)
    return { ok: false, code: E.ServiceRequestNotFound };
  const parsed = serviceRequestSchemas.accept.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.ValidationError };
  const data = parsed.data;
  try {
    return await getDrizzleDatabaseClient().transaction(async (tx) => {
      const request = await access.lock(tx, id, actor);
      if (!request) return { ok: false, code: E.ServiceRequestNotFound };
      if (
        !canTransitionServiceRequest(
          request.status,
          S.Accepted,
          ServiceRequestTransitionSide.Internal,
        )
      )
        return { ok: false, code: E.InvalidTransition };
      if (request.version !== data.version)
        return {
          ok: false,
          code: E.VersionConflict,
          conflict: {
            code: ConcurrencyErrorCode.VersionConflict,
            currentVersion: request.version,
            current: await access.toDto(tx, request, actor),
          },
        };
      // The customer has seen no price before an offer; skipping it must be stated, never implied.
      if (
        isServiceRequestWithoutOffer(request.status) &&
        !data.acceptWithoutOffer
      )
        return { ok: false, code: E.OfferRequired };
      // Whoever cannot read the catalog cannot choose from it, so they do not assign from it either.
      if (!can(actor, Permission.LineItemTemplatesRead))
        return { ok: false, code: E.CatalogNotReadable };
      // A catalog request keeps its template for as long as that one can still be assigned.
      if (request.line_item_template_id !== null) {
        if (data.template.mode !== Mode.Existing)
          return { ok: false, code: E.ValidationError };
        const [original] = await tx
          .select({ id: lineItemTemplates.id, kind: lineItemTemplates.kind })
          .from(lineItemTemplates)
          .where(
            and(
              eq(lineItemTemplates.id, request.line_item_template_id),
              eq(lineItemTemplates.status, LineItemTemplateStatus.Active),
            ),
          )
          .limit(1);
        if (
          original &&
          (original.kind ?? LineItemKind.Standard) === request.kind &&
          data.template.lineItemTemplateId !== original.id
        )
          return { ok: false, code: E.ValidationError };
      }
      let template;
      if (data.template.mode === Mode.Existing) {
        const [found] = await tx
          .select()
          .from(lineItemTemplates)
          .where(
            and(
              eq(lineItemTemplates.id, data.template.lineItemTemplateId),
              eq(lineItemTemplates.status, LineItemTemplateStatus.Active),
            ),
          )
          .limit(1)
          .for("share");
        if (!found) return fail(E.TemplateNotAssignable);
        template = found;
      } else {
        if (
          request.kind !== LineItemKind.Standard ||
          !can(actor, Permission.LineItemTemplatesWrite)
        )
          return fail(E.EffectNotPermitted);
        template = await insertLineItemTemplate(tx, {
          ...data.template.template,
          kind: LineItemKind.Standard,
          portalRequestable: false,
          portalDescription: "",
        });
      }
      const kind = template.kind ?? LineItemKind.Standard;
      if (kind !== request.kind) return fail(E.KindMismatch);
      let project;
      if (data.project.mode === Mode.Existing) {
        const [found] = await tx
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.id, data.project.projectId),
              eq(projects.customer_id, request.customer_id),
            ),
          )
          .limit(1)
          .for("no key update");
        if (
          !found ||
          !canOn(actor, Permission.ProjectLineItemsWrite, {
            customerId: request.customer_id,
            projectId: found.id,
          })
        )
          return fail(E.ProjectNotFound);
        project = found;
      } else {
        if (
          request.kind !== LineItemKind.Standard ||
          !canOn(actor, Permission.ProjectsWrite, {
            customerId: request.customer_id,
          }) ||
          !canOn(actor, Permission.ProjectLineItemsWrite, {
            customerId: request.customer_id,
          })
        )
          return fail(E.EffectNotPermitted);
        const [customer] = await tx
          .select({
            owner: customers.owner_member_id,
            status: customers.status,
          })
          .from(customers)
          .where(eq(customers.id, request.customer_id))
          .limit(1)
          .for("share");
        if (!customer || customer.status === CustomerStatus.Archived)
          return fail(E.ProjectNotFound);
        project = await insertProject(
          tx,
          request.customer_id,
          customer.owner,
          data.project.project,
        );
      }
      const assignment = await projectLineItemAssignmentService.assign(tx, {
        actor,
        project: {
          id: project.id,
          customerId: request.customer_id,
          status: project.status,
        },
        template: { id: template.id, kind },
        fields: { ...data.lineItem },
      });
      if (!assignment.ok) return fail(ASSIGNMENT_FAILURE[assignment.code]);
      const changed = await updateLockedVersioned(
        {
          tx,
          table: serviceRequests,
          id,
          expectedVersion: request.version,
          patch: {
            status: S.Accepted,
            decided_at: new Date(),
            decided_by_member_id: actor.workspaceMemberId,
            project_id: project.id,
            project_line_item_id: assignment.row.id,
          },
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
  } catch (error) {
    if (error instanceof AcceptanceFailure) return error.result;
    throw error;
  }
}
