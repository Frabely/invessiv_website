import { LeadErrorCode } from "@/common/constants/leads/lead-error-codes";
import type { CreateLeadRequestDto } from "@/common/contracts/leads/create-lead-request.dto";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import type { CreateLeadResult } from "@/common/contracts/leads/results/create-lead-result";
import type { z } from "zod";

const LEAD_API_PATH = "/api/workspace/leads";

type LeadApiErrorPayload = {
  details?: unknown;
  error?: string;
  lead?: unknown;
  message?: string;
};

type CreateLeadServiceResult =
  | CreateLeadResult
  | { ok: false; code: typeof LeadErrorCode.Internal };

async function createLead(
  request: CreateLeadRequestDto,
): Promise<CreateLeadServiceResult> {
  try {
    const response = await fetch(LEAD_API_PATH, {
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      if (response.status === 409) {
        return { ok: false, code: LeadErrorCode.EmailExists };
      }

      if (isLeadApiErrorPayload(payload) && Array.isArray(payload.details)) {
        return {
          errors: payload.details as z.core.$ZodIssue[],
          ok: false,
          code: LeadErrorCode.ValidationError,
        };
      }

      return { ok: false, code: LeadErrorCode.Internal };
    }

    if (isLeadApiErrorPayload(payload) && isLeadDetailDto(payload.lead)) {
      return { ok: true, lead: payload.lead };
    }

    return { ok: false, code: LeadErrorCode.Internal };
  } catch {
    return { ok: false, code: LeadErrorCode.Internal };
  }
}

function isLeadApiErrorPayload(value: unknown): value is LeadApiErrorPayload {
  return typeof value === "object" && value !== null;
}

function isLeadDetailDto(value: unknown): value is LeadDetailDto {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "string"
  );
}

export const leadsService = {
  createLead,
};
