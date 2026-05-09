import { LeadErrorCode } from "@/common/constants/leads/errors/lead-error-codes";
import type { BulkEditLeadsInput } from "@/common/contracts/leads/bulk-edit-leads-input";
import type { CreateLeadRequestDto } from "@/common/contracts/leads/create-lead-request.dto";
import type { UpdateLeadRequestDto } from "@/common/contracts/leads/update-lead-request.dto";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import type { BulkEditLeadsResult } from "@/common/contracts/leads/results/bulk-edit-leads-result";
import type { CreateLeadResult } from "@/common/contracts/leads/results/create-lead-result";
import type { UpdateLeadResult } from "@/common/contracts/leads/results/update-lead-result";
import type { z } from "zod";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";

const LEAD_API_PATH = "/api/workspace/leads";

type LeadApiErrorPayload = {
  details?: unknown;
  error?: string;
  lead?: unknown;
  message?: string;
};

type DeleteLeadSuccessPayload = {
  ok: true;
  status: typeof ContactLeadStatus.Archived;
};

type BulkEditLeadsSuccessPayload = {
  ok: true;
  updatedCount: number;
};

type CreateLeadServiceResult =
  | CreateLeadResult
  | { ok: false; code: typeof LeadErrorCode.Internal };

type UpdateLeadServiceResult =
  | UpdateLeadResult
  | { ok: false; code: typeof LeadErrorCode.Internal };

type DeleteLeadServiceResult =
  | { ok: true; status: typeof ContactLeadStatus.Archived }
  | { ok: false; code: typeof LeadErrorCode.NotFound }
  | { ok: false; code: typeof LeadErrorCode.Internal };

type BulkEditLeadsServiceResult =
  | BulkEditLeadsResult
  | {
      ok: false;
      code: typeof LeadErrorCode.ValidationError;
      errors: z.core.$ZodIssue[];
    }
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

async function deleteLead(leadId: string): Promise<DeleteLeadServiceResult> {
  try {
    const response = await fetch(`${LEAD_API_PATH}/${leadId}`, {
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
      return { ok: true, status: ContactLeadStatus.Archived };
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
    const response = await fetch(`${LEAD_API_PATH}/${leadId}`, {
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

async function bulkEditLeads(
  request: BulkEditLeadsInput,
): Promise<BulkEditLeadsServiceResult> {
  try {
    const response = await fetch(`${LEAD_API_PATH}/bulk`, {
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      if (isLeadApiErrorPayload(payload) && Array.isArray(payload.details)) {
        return {
          errors: payload.details as z.core.$ZodIssue[],
          ok: false,
          code: LeadErrorCode.ValidationError,
        };
      }

      return { ok: false, code: LeadErrorCode.Internal };
    }

    if (isBulkEditLeadsSuccessPayload(payload)) {
      return { ok: true, updatedCount: payload.updatedCount };
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
    (value as { ok?: unknown }).ok === true &&
    "status" in value &&
    (value as { status?: unknown }).status === ContactLeadStatus.Archived
  );
}

function isBulkEditLeadsSuccessPayload(
  value: unknown,
): value is BulkEditLeadsSuccessPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    (value as { ok?: unknown }).ok === true &&
    "updatedCount" in value &&
    typeof (value as { updatedCount?: unknown }).updatedCount === "number"
  );
}

export const leadsService = {
  bulkEditLeads,
  createLead,
  deleteLead,
  updateLead,
};
