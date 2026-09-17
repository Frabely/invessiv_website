import {
  LEAD_CONVERSION_ERROR_CODE_VALUES,
  LeadConversionErrorCode,
} from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import type { ConvertLeadToCustomerRequestDto } from "@invessiv/common/contracts/crm/convert-lead-to-customer-request.dto";
import type { ConvertLeadToCustomerResultDto } from "@invessiv/common/contracts/crm/convert-lead-to-customer-result.dto";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import { crmLeadConversionEndpoint } from "@/common/patterns/crm/crm-api-endpoints";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCustomer(value: unknown): value is CustomerDetailDto {
  return isRecord(value) && typeof value.id === "string";
}

async function convertLead(
  leadId: string,
  request: ConvertLeadToCustomerRequestDto,
): Promise<ConvertLeadToCustomerResultDto> {
  try {
    const response = await fetch(crmLeadConversionEndpoint(leadId), {
      method: HttpMethod.Post,
      body: JSON.stringify(request),
      headers: { [HttpHeaderName.ContentType]: MediaType.Json },
    });
    const payload = (await response.json().catch(() => null)) as unknown;
    if (response.ok && isRecord(payload) && isCustomer(payload.customer)) {
      return { ok: true, customer: payload.customer };
    }
    const code = isRecord(payload) ? payload.error : undefined;
    return {
      ok: false,
      code:
        LEAD_CONVERSION_ERROR_CODE_VALUES.find((value) => value === code) ??
        LeadConversionErrorCode.Internal,
    };
  } catch {
    return { ok: false, code: LeadConversionErrorCode.Internal };
  }
}

export const leadConversionApiService = { convertLead } as const;
