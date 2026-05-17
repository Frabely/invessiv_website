"use client";

import { OutreachLmStudio } from "@/common/ai-outreach-generation/outreach-lm-studio";

const PROVIDER_STATUS_ENDPOINT = "/api/workspace/outreach/provider-status";
const LOCAL_CHECK_TIMEOUT_MS = 1500;

type LocalLmStudioModelInstance = {
  id?: string;
};

type LocalLmStudioModel = {
  loaded_instances?: LocalLmStudioModelInstance[];
  type?: "llm" | "embedding";
};

type LocalLmStudioModelsResponse = {
  data?: LocalLmStudioModel[];
  models?: LocalLmStudioModel[];
};

export type LocalLmStudioStatus =
  | { running: false }
  | { running: true; modelLoaded: false }
  | { running: true; modelLoaded: true; modelName: string };

function getLocalLmStudioModels(
  data: LocalLmStudioModelsResponse,
): LocalLmStudioModel[] {
  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.models)) {
    return data.models;
  }

  return [];
}

function getLoadedLlmModelName(models: LocalLmStudioModel[]): string | null {
  for (const model of models) {
    if (model.type === "embedding") {
      continue;
    }

    const loadedInstance = model.loaded_instances?.find(
      (instance): instance is LocalLmStudioModelInstance & { id: string } =>
        typeof instance?.id === "string" && instance.id.length > 0,
    );

    if (loadedInstance) {
      return loadedInstance.id;
    }
  }

  return null;
}

export interface OutreachProviderStatus {
  local: LocalLmStudioStatus;
  openai: boolean;
  openaiModel: string | null;
}

async function checkLocalLmStudio(): Promise<LocalLmStudioStatus> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    LOCAL_CHECK_TIMEOUT_MS,
  );
  try {
    const response = await fetch(
      `${OutreachLmStudio.NativeApiBaseUrl}/models`,
      { method: "GET", signal: controller.signal },
    );
    if (!response.ok) {
      return { running: false };
    }
    const data = (await response.json()) as LocalLmStudioModelsResponse;
    const models = getLocalLmStudioModels(data);
    const loadedModelName = getLoadedLlmModelName(models);

    if (!loadedModelName) {
      return { running: true, modelLoaded: false };
    }

    return { running: true, modelLoaded: true, modelName: loadedModelName };
  } catch {
    try {
      const response = await fetch(
        `${OutreachLmStudio.DefaultBaseUrl}/models`,
        { method: "GET", signal: controller.signal },
      );
      if (!response.ok) {
        return { running: false };
      }

      return { running: true, modelLoaded: false };
    } catch {
      return { running: false };
    }
  } finally {
    window.clearTimeout(timeout);
  }
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

export async function checkOutreachProviders(): Promise<OutreachProviderStatus> {
  const [local, server] = await Promise.all([
    checkLocalLmStudio(),
    checkServerProviders(),
  ]);
  return { local, openai: server.openai, openaiModel: server.model };
}

export const outreachProviderStatusService = {
  checkLocalLmStudio,
  checkServerProviders,
  checkOutreachProviders,
} as const;
