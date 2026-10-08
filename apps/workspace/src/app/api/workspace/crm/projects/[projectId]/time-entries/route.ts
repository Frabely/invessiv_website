import "server-only";

import type { NextRequest } from "next/server";

import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateTimeEntryRequestDto } from "@invessiv/common/contracts/crm/hours/create-time-entry-request.dto";
import type { CreateTimeEntryResult } from "@invessiv/common/contracts/crm/results/create-time-entry-result";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { TimeEntryQueryParam } from "@/common/constants/crm/time-entry-query-params";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { hoursApiError } from "@/lib/workspace/crm/hours-api-error";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { createTimeEntry } from "@/server/workspace/crm/command-handler/create-time-entry.command-handler";
import { listProjectTimeEntries } from "@/server/workspace/crm/query-handler/list-project-time-entries.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.TimeEntries,
    async (authorizedRequest, actor) => {
      let result: Awaited<ReturnType<typeof listProjectTimeEntries>>;
      try {
        result = await listProjectTimeEntries(
          projectId,
          {
            cursor: authorizedRequest.nextUrl.searchParams.get(
              TimeEntryQueryParam.Cursor,
            ),
          },
          actor,
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.ListTimeEntries, error);
        return hoursApiError(HoursErrorCode.Internal);
      }

      if (!result.ok) return hoursApiError(result.code);
      return Response.json(result.page, { status: HttpResponseCode.Ok });
    },
  )(request);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.TimeEntryCreate,
    async (authorizedRequest, actor) => {
      const parsed = await readJsonBody(authorizedRequest);
      if (!parsed.ok) {
        return hoursApiError(HoursErrorCode.ValidationError, {
          status: HttpResponseCode.BadRequest,
        });
      }

      let result: CreateTimeEntryResult;
      try {
        // The command validates the body against its schema before using it.
        result = await createTimeEntry(
          projectId,
          parsed.body as CreateTimeEntryRequestDto,
          actor,
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.CreateTimeEntry, error);
        return hoursApiError(HoursErrorCode.Internal);
      }

      if (!result.ok) {
        return hoursApiError(result.code, {
          details: "errors" in result ? result.errors : undefined,
        });
      }

      return Response.json(
        { timeEntry: result.timeEntry, project: result.project },
        { status: HttpResponseCode.Created },
      );
    },
  )(request);
}
