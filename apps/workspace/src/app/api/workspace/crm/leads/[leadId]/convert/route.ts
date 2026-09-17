import "server-only";

import type { NextRequest } from "next/server";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { ConvertLeadToCustomerRequestDto } from "@invessiv/common/contracts/crm/convert-lead-to-customer-request.dto";
import { can } from "@invessiv/common/patterns/auth/can";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withPermission } from "@/lib/auth/api";
import { authApiError } from "@/lib/auth/auth-api-error";
import { readJsonBody } from "@/lib/http/read-json-body";
import { leadConversionApiError } from "@/lib/workspace/crm/lead-conversion-api-error";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { convertLeadToCustomer } from "@/server/workspace/crm/command-handler/convert-lead-to-customer.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ leadId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { leadId } = await params;

  return withPermission(Permission.CustomersWrite, async (req, actor) => {
    if (!can(actor, Permission.LeadsWrite)) {
      return authApiError(AuthErrorCode.Forbidden, HttpResponseCode.Forbidden);
    }

    const parsed = await readJsonBody(req);
    if (!parsed.ok) {
      return leadConversionApiError(LeadConversionErrorCode.ValidationError, {
        status: HttpResponseCode.BadRequest,
      });
    }

    try {
      const result = await convertLeadToCustomer(
        leadId,
        parsed.body as ConvertLeadToCustomerRequestDto,
        actor,
      );
      if (!result.ok) {
        return leadConversionApiError(result.code, {
          details: result.errors,
        });
      }
      return Response.json(
        { customer: result.customer },
        { status: HttpResponseCode.Created },
      );
    } catch (error: unknown) {
      logCrmFailure(CrmOperation.ConvertLead, error);
      return leadConversionApiError(LeadConversionErrorCode.Internal);
    }
  })(request);
}
