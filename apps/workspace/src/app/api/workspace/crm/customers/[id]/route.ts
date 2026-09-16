import "server-only";

import type { NextRequest } from "next/server";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateCustomerResult } from "@invessiv/common/contracts/crm/results/update-customer-result";
import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { customerApiError } from "@/lib/workspace/crm/customer-api-error";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { updateCustomer } from "@/server/workspace/crm/command-handler/update-customer.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withPermission(Permission.CustomersWrite, async (req, actor) => {
    const parsed = await readJsonBody(req);
    if (!parsed.ok) {
      return customerApiError(CustomerErrorCode.ValidationError, {
        status: HttpResponseCode.BadRequest,
      });
    }

    let result: UpdateCustomerResult;
    try {
      // The command validates the body against its schema before using it.
      result = await updateCustomer(
        id,
        parsed.body as UpdateCustomerRequestDto,
        actor.userId,
      );
    } catch (error: unknown) {
      logCrmFailure(CrmOperation.UpdateCustomer, error);
      return customerApiError(CustomerErrorCode.Internal);
    }

    if (result.ok) {
      return Response.json(
        { customer: result.customer },
        { status: HttpResponseCode.Ok },
      );
    }
    if ("conflict" in result) {
      return Response.json(result.conflict, {
        status: HttpResponseCode.Conflict,
      });
    }

    return customerApiError(result.code, {
      details: "errors" in result ? result.errors : undefined,
    });
  })(request);
}
