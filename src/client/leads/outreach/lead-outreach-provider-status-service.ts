"use client";

import { PROVIDER_STATUS_ENDPOINT } from "@/common/constants/leads/outreach/lead-outreach-api-endpoints";

export interface OutreachProviderStatus {
  openai: boolean;
  openaiModel: string | null;
}

async function checkServerProviders(): Promise<{
  openai: boolean;
  model: string | null;
}> {
  try {
    const response = await fetch(PROVIDER_STATUS_ENDPOINT, {
      method: "GET",
    });
    if (!response.ok) {
      return { openai: false, model: null };
    }
    const data = (await response.json()) as {
      providers?: { openai?: { available?: boolean; model?: string } };
    };
    const openai = data?.providers?.openai;
    return {
      openai: Boolean(openai?.available),
      model: openai?.model ?? null,
    };
  } catch {
    return { openai: false, model: null };
  }
}

async function checkOutreachProviders(): Promise<OutreachProviderStatus> {
  const server = await checkServerProviders();
  return { openai: server.openai, openaiModel: server.model };
}

export const outreachProviderStatusService = {
  checkServerProviders,
  checkOutreachProviders,
} as const;
