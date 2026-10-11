import "server-only";

import type { NextRequest } from "next/server";

import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateHourAllocationRequestDto } from "@invessiv/common/contracts/crm/hours/create-hour-allocation-request.dto";
import type { CreateHourAllocationResult } from "@invessiv/common/contracts/crm/results/create-hour-allocation-result";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { hoursApiError } from "@/lib/workspace/crm/hours-api-error";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { createHourAllocation } from "@/server/workspace/crm/command-handler/create-hour-allocation.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * The allocation lives under the customer and names its project in the body: `hours.manage` can
 * only be bound to a customer, and the command checks it there.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.HourAllocationCreate,
    async (authorizedRequest, actor) => {
      const parsed = await readJsonBody(authorizedRequest);
      if (!parsed.ok) {
        return hoursApiError(HoursErrorCode.ValidationError, {
          status: HttpResponseCode.BadRequest,
        });
      }

      let result: CreateHourAllocationResult;
      try {
        // The command validates the body against its schema before using it.
        result = await createHourAllocation(
          id,
          parsed.body as CreateHourAllocationRequestDto,
          actor,
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.CreateHourAllocation, error);
        return hoursApiError(HoursErrorCode.Internal);
      }

      if (!result.ok) {
        // A rejected movement answers with the current figures so the dialog shows the real limit.
        return hoursApiError(result.code, {
          details:
            "balance" in result
              ? { balance: result.balance, project: result.project }
              : "errors" in result
                ? result.errors
                : undefined,
        });
      }

      return Response.json(
        {
          allocation: result.allocation,
          balance: result.balance,
          project: result.project,
        },
        { status: HttpResponseCode.Created },
      );
    },
  )(request);
}
