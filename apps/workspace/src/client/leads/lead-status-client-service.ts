"use client";

import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import type { MarkLeadContactedResult } from "@invessiv/common/contracts/leads/results/mark-lead-contacted-result";
import { buildLeadMarkContactedEndpoint } from "@/common/patterns/leads/build-lead-endpoint";

async function markContacted(leadId: string): Promise<MarkLeadContactedResult> {
  try {
    const response = await fetch(buildLeadMarkContactedEndpoint(leadId), {
      method: "POST",
    });

    const payload = await response.json().catch(() => null);

    if (response.ok && payload && (payload as { ok?: unknown }).ok === true) {
      return payload as MarkLeadContactedResult;
    }

    return { ok: false, code: LeadErrorCode.Internal };
  } catch {
    return { ok: false, code: LeadErrorCode.Internal };
  }
}

export const leadStatusClientService = {
  markContacted,
} as const;
