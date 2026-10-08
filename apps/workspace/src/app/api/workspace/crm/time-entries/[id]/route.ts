import "server-only";

import type { NextRequest } from "next/server";

import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";
import type { UpdateTimeEntryRequestDto } from "@invessiv/common/contracts/crm/hours/update-time-entry-request.dto";
import type { DeleteTimeEntryResult } from "@invessiv/common/contracts/crm/results/delete-time-entry-result";
import type { UpdateTimeEntryResult } from "@invessiv/common/contracts/crm/results/update-time-entry-result";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { hoursApiError } from "@/lib/workspace/crm/hours-api-error";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { deleteTimeEntry } from "@/server/workspace/crm/command-handler/delete-time-entry.command-handler";
import { updateTimeEntry } from "@/server/workspace/crm/command-handler/update-time-entry.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** A stale version answers 409 with the entry as it stands, never as a generic error. */
function failure(
  result: Exclude<UpdateTimeEntryResult | DeleteTimeEntryResult, { ok: true }>,
): Response {
  if ("conflict" in result) {
    return Response.json(result.conflict, {
      status: HttpResponseCode.Conflict,
    });
  }
  return hoursApiError(result.code, {
    details: "errors" in result ? result.errors : undefined,
  });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.TimeEntryUpdate,
    async (authorizedRequest, actor) => {
      const parsed = await readJsonBody(authorizedRequest);
      if (!parsed.ok) {
        return hoursApiError(HoursErrorCode.ValidationError, {
          status: HttpResponseCode.BadRequest,
        });
      }

      let result: UpdateTimeEntryResult;
      try {
        // The command validates the body against its schema before using it.
        result = await updateTimeEntry(
          id,
          parsed.body as UpdateTimeEntryRequestDto,
          actor,
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.UpdateTimeEntry, error);
        return hoursApiError(HoursErrorCode.Internal);
      }

      if (!result.ok) return failure(result);
      return Response.json(
        { timeEntry: result.timeEntry, project: result.project },
        { status: HttpResponseCode.Ok },
      );
    },
  )(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.TimeEntryDelete,
    async (authorizedRequest, actor) => {
      const parsed = await readJsonBody(authorizedRequest);
      if (!parsed.ok) {
        return hoursApiError(HoursErrorCode.ValidationError, {
          status: HttpResponseCode.BadRequest,
        });
      }

      let result: DeleteTimeEntryResult;
      try {
        result = await deleteTimeEntry(
          id,
          parsed.body as VersionedWriteInput,
          actor,
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.DeleteTimeEntry, error);
        return hoursApiError(HoursErrorCode.Internal);
      }

      if (!result.ok) return failure(result);
      return Response.json(
        { deleted: true, project: result.project },
        { status: HttpResponseCode.Ok },
      );
    },
  )(request);
}
