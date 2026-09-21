import "server-only";

import type { NextRequest } from "next/server";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { can } from "@invessiv/common/patterns/auth/can";
import { formValidationSchemas } from "@invessiv/common/patterns/validation/form-validation-schemas";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import { authApiError } from "@/lib/auth/auth-api-error";
import { readJsonBody } from "@/lib/http/read-json-body";
import { leadConversionApiError } from "@/lib/workspace/crm/lead-conversion-api-error";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { convertLeadToCustomer } from "@/server/workspace/crm/command-handler/convert-lead-to-customer.command-handler";
import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ leadId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { leadId } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.LeadConversion,
    async (req, actor) => {
      if (!can(actor, Permission.LeadsWrite)) {
        return authApiError(
          AuthErrorCode.Forbidden,
          HttpResponseCode.Forbidden,
        );
      }

      if (!formValidationSchemas.uuid.safeParse(leadId).success) {
        return leadConversionApiError(LeadConversionErrorCode.LeadNotFound);
      }

      const parsed = await readJsonBody(req);
      if (!parsed.ok) {
        return leadConversionApiError(LeadConversionErrorCode.ValidationError, {
          status: HttpResponseCode.BadRequest,
        });
      }

      const validation = customerSchemas.create.safeParse(parsed.body);
      if (!validation.success) {
        return leadConversionApiError(LeadConversionErrorCode.ValidationError, {
          details: validation.error.issues,
        });
      }

      try {
        const result = await convertLeadToCustomer(
          leadId,
          validation.data,
          actor,
        );
        if (!result.ok) {
          return leadConversionApiError(result.code, {
            details: result.errors,
          });
        }
        return Response.json(
          { customerId: result.customerId },
          { status: HttpResponseCode.Created },
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.ConvertLead, error);
        return leadConversionApiError(LeadConversionErrorCode.Internal);
      }
    },
  )(request);
}
