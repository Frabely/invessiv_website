import "server-only";

import type { NextRequest } from "next/server";

import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateCustomerResult } from "@invessiv/common/contracts/crm/results/update-customer-result";
import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { customerApiError } from "@/lib/workspace/crm/customer-api-error";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { updateCustomer } from "@/server/workspace/crm/command-handler/update-customer.command-handler";
import { getCustomerById } from "@/server/workspace/crm/query-handler/get-customer-by-id.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.CustomerDetail,
    async (_, actor) => {
      try {
        const customer = await getCustomerById(id, actor);
        if (!customer) {
          return customerApiError(CustomerErrorCode.CustomerNotFound);
        }
        return Response.json({ customer }, { status: HttpResponseCode.Ok });
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.GetCustomer, error);
        return customerApiError(CustomerErrorCode.Internal);
      }
    },
  )(request);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.CustomerUpdate,
    async (req, actor) => {
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
          actor,
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
    },
  )(request);
}
