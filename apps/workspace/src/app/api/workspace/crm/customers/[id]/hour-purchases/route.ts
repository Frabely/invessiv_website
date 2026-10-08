import "server-only";

import type { NextRequest } from "next/server";

import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateHourPurchaseRequestDto } from "@invessiv/common/contracts/crm/hours/create-hour-purchase-request.dto";
import type { CreateHourPurchaseResult } from "@invessiv/common/contracts/crm/results/create-hour-purchase-result";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { hoursApiError } from "@/lib/workspace/crm/hours-api-error";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { createHourPurchase } from "@/server/workspace/crm/command-handler/create-hour-purchase.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.HourPurchaseCreate,
    async (authorizedRequest, actor) => {
      const parsed = await readJsonBody(authorizedRequest);
      if (!parsed.ok) {
        return hoursApiError(HoursErrorCode.ValidationError, {
          status: HttpResponseCode.BadRequest,
        });
      }

      let result: CreateHourPurchaseResult;
      try {
        // The command validates the body against its schema before using it.
        result = await createHourPurchase(
          id,
          parsed.body as CreateHourPurchaseRequestDto,
          actor,
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.CreateHourPurchase, error);
        return hoursApiError(HoursErrorCode.Internal);
      }

      if (!result.ok) {
        // A rejected correction answers with the balance so the dialog shows the real limit.
        return hoursApiError(result.code, {
          details:
            "balance" in result
              ? { balance: result.balance }
              : "errors" in result
                ? result.errors
                : undefined,
        });
      }

      return Response.json(
        { purchase: result.purchase, balance: result.balance },
        { status: HttpResponseCode.Created },
      );
    },
  )(request);
}
