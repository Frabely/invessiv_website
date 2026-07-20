import type { LeadErrorCode as LeadErrorCodeType } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import type { CreateLeadRequestDto } from "@invessiv/common/contracts/leads/create-lead-request.dto";
import type { UpdateLeadRequestDto } from "@invessiv/common/contracts/leads/update-lead-request.dto";
import type { LeadDetailDto } from "@invessiv/common/contracts/leads/lead-detail.dto";
import type { CreateLeadResult } from "@invessiv/common/contracts/leads/results/create-lead-result";
import type { UpdateLeadResult } from "@invessiv/common/contracts/leads/results/update-lead-result";
import type { z } from "zod";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

type LeadApiErrorPayload = {
  details?: unknown;
  error?: string;
  lead?: unknown;
  message?: string;
};

type DeleteLeadSuccessPayload = {
  ok: true;
};

type CreateLeadServiceResult =
  CreateLeadResult | { ok: false; code: LeadErrorCodeType };

type UpdateLeadServiceResult =
  UpdateLeadResult | { ok: false; code: LeadErrorCodeType };

type DeleteLeadServiceResult =
  { ok: true } | { ok: false; code: LeadErrorCodeType };

function mapLeadMutationConflictCode(
  payload: unknown,
  fallbackCode: LeadErrorCodeType,
): LeadErrorCodeType {
  if (
    isLeadApiErrorPayload(payload) &&
    payload.error === LeadErrorCode.CompanyNameExists
  ) {
    return LeadErrorCode.CompanyNameExists;
  }

  if (
    isLeadApiErrorPayload(payload) &&
    payload.error === LeadErrorCode.SocialProfileExists
  ) {
    return LeadErrorCode.SocialProfileExists;
  }

  return fallbackCode;
}

async function createLead(
  request: CreateLeadRequestDto,
): Promise<CreateLeadServiceResult> {
  try {
    const response = await fetch(WorkspaceApiEndpoint.Leads, {
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      if (response.status === 409) {
        return {
          ok: false,
          code: mapLeadMutationConflictCode(payload, LeadErrorCode.EmailExists),
        };
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

async function deleteLead(leadId: string): Promise<DeleteLeadServiceResult> {
  try {
    const response = await fetch(`${WorkspaceApiEndpoint.Leads}/${leadId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      if (response.status === 404) {
        return { ok: false, code: LeadErrorCode.NotFound };
      }

      return { ok: false, code: LeadErrorCode.Internal };
    }

    if (isDeleteLeadSuccessPayload(payload)) {
      return { ok: true };
    }

    return { ok: false, code: LeadErrorCode.Internal };
  } catch {
    return { ok: false, code: LeadErrorCode.Internal };
  }
}

async function updateLead(
  leadId: string,
  request: UpdateLeadRequestDto,
): Promise<UpdateLeadServiceResult> {
  try {
    const response = await fetch(`${WorkspaceApiEndpoint.Leads}/${leadId}`, {
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      if (response.status === 404) {
        return { ok: false, code: LeadErrorCode.NotFound };
      }

      if (response.status === 409) {
        return {
          ok: false,
          code: mapLeadMutationConflictCode(payload, LeadErrorCode.EmailExists),
        };
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

function isDeleteLeadSuccessPayload(
  value: unknown,
): value is DeleteLeadSuccessPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    (value as { ok?: unknown }).ok === true
  );
}

export const leadsService = {
  createLead,
  deleteLead,
  updateLead,
};
