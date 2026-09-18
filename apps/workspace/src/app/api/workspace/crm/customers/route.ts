import "server-only";

import type { NextRequest } from "next/server";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateCustomerRequestDto } from "@invessiv/common/contracts/crm/create-customer-request.dto";
import type { CreateCustomerResult } from "@invessiv/common/contracts/crm/results/create-customer-result";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission, withPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { customerApiError } from "@/lib/workspace/crm/customer-api-error";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { createCustomer } from "@/server/workspace/crm/command-handler/create-customer.command-handler";
import { listCustomers } from "@/server/workspace/crm/query-handler/list-customers.query-handler";
import { parseCustomerListFilters } from "@/common/patterns/crm/customer-list-search-params";

export const runtime = "nodejs";

export const GET = withCrmPermission(
  CrmEndpointAccessRule.Customers,
  async (request, actor) => {
    try {
      const params: Record<string, string | string[]> = {};
      new URL(request.url).searchParams.forEach((value, key) => {
        const current = params[key];
        params[key] = current
          ? Array.isArray(current)
            ? [...current, value]
            : [current, value]
          : value;
      });
      const result = await listCustomers(
        parseCustomerListFilters(params),
        actor,
      );
      return Response.json(result, { status: HttpResponseCode.Ok });
    } catch (error: unknown) {
      logCrmFailure(CrmOperation.ListCustomers, error);
      return customerApiError(CustomerErrorCode.Internal);
    }
  },
);

export const POST = withPermission(
  Permission.CustomersWrite,
  async (request: NextRequest, actor) => {
    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return customerApiError(CustomerErrorCode.ValidationError, {
        status: HttpResponseCode.BadRequest,
      });
    }

    let result: CreateCustomerResult;
    try {
      // The command validates the body against its schema before using it.
      result = await createCustomer(
        parsed.body as CreateCustomerRequestDto,
        actor,
      );
    } catch (error: unknown) {
      logCrmFailure(CrmOperation.CreateCustomer, error);
      return customerApiError(CustomerErrorCode.Internal);
    }

    if (!result.ok) {
      return customerApiError(result.code, {
        details: "errors" in result ? result.errors : undefined,
      });
    }

    return Response.json(
      { customer: result.customer },
      { status: HttpResponseCode.Created },
    );
  },
);
