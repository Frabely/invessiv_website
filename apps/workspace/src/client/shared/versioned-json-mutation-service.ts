import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import type { VersionedJsonMutationResult } from "@/common/contracts/client/versioned-json-mutation-result";

type JsonApiResponse = { ok: boolean; status: number; payload: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function send(
  url: string,
  method: HttpMethod,
  body: unknown,
): Promise<JsonApiResponse | null> {
  try {
    const response = await fetch(url, {
      method,
      body: JSON.stringify(body),
      headers: { [HttpHeaderName.ContentType]: MediaType.Json },
    });
    const payload = (await response.json().catch(() => null)) as unknown;
    return { ok: response.ok, status: response.status, payload };
  } catch {
    return null;
  }
}

function readErrorCode<TCode extends string>(
  payload: unknown,
  knownCodes: readonly TCode[],
  fallback: TCode,
): TCode {
  const error = isRecord(payload) ? payload.error : undefined;
  return knownCodes.find((code) => code === error) ?? fallback;
}

function readVersionConflict<TCurrent>(
  response: JsonApiResponse,
  isCurrent: (value: unknown) => value is TCurrent,
): TCurrent | null {
  if (
    response.status === HttpResponseCode.Conflict &&
    isRecord(response.payload) &&
    response.payload.code === ConcurrencyErrorCode.VersionConflict &&
    isCurrent(response.payload.current)
  ) {
    return response.payload.current;
  }
  return null;
}

async function mutate<TValue, TErrorCode extends string>(
  url: string,
  method: HttpMethod,
  body: unknown,
  readSuccessValue: (payload: unknown) => TValue | null,
  isCurrent: (value: unknown) => value is TValue,
  knownErrorCodes: readonly TErrorCode[],
  fallbackErrorCode: TErrorCode,
): Promise<VersionedJsonMutationResult<TValue, TErrorCode>> {
  const response = await send(url, method, body);
  if (!response) {
    return { ok: false, code: fallbackErrorCode };
  }

  const value = readSuccessValue(response.payload);
  if (response.ok && value !== null) {
    return { ok: true, value };
  }

  const current = readVersionConflict(response, isCurrent);
  if (current !== null) {
    return {
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current,
    };
  }

  return {
    ok: false,
    code: readErrorCode(response.payload, knownErrorCodes, fallbackErrorCode),
  };
}

export const versionedJsonMutationService = {
  isRecord,
  mutate,
  readErrorCode,
  readVersionConflict,
  send,
} as const;
