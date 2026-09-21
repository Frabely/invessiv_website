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
    // A GET carries no body, so it also skips the body-only Content-Type header.
    const init: RequestInit =
      body === undefined
        ? { method }
        : {
            method,
            body: JSON.stringify(body),
            headers: { [HttpHeaderName.ContentType]: MediaType.Json },
          };
    const response = await fetch(url, init);
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

/**
 * Same as `mutate`, but wraps the success value under `key` instead of `value` — the shape every
 * DTO-specific client result (`{ customer }`, `{ lineItemTemplate }`, …) actually needs. Callers no
 * longer hand-roll the ok/conflict/error unwrap themselves.
 */
async function mutateNamed<
  TKey extends string,
  TValue,
  TErrorCode extends string,
>(
  key: TKey,
  url: string,
  method: HttpMethod,
  body: unknown,
  readSuccessValue: (payload: unknown) => TValue | null,
  isCurrent: (value: unknown) => value is TValue,
  knownErrorCodes: readonly TErrorCode[],
  fallbackErrorCode: TErrorCode,
): Promise<
  | ({ ok: true } & Record<TKey, TValue>)
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: TValue;
    }
  | { ok: false; code: TErrorCode }
> {
  const result = await mutate(
    url,
    method,
    body,
    readSuccessValue,
    isCurrent,
    knownErrorCodes,
    fallbackErrorCode,
  );
  if (!result.ok) {
    return result;
  }
  return { ok: true, [key]: result.value } as { ok: true } & Record<
    TKey,
    TValue
  >;
}

async function read<TValue, TErrorCode extends string>(
  url: string,
  readSuccessValue: (payload: unknown) => TValue | null,
  knownErrorCodes: readonly TErrorCode[],
  fallbackErrorCode: TErrorCode,
): Promise<{ ok: true; value: TValue } | { ok: false; code: TErrorCode }> {
  const response = await send(url, HttpMethod.Get, undefined);
  if (!response) {
    return { ok: false, code: fallbackErrorCode };
  }

  const value = readSuccessValue(response.payload);
  if (response.ok && value !== null) {
    return { ok: true, value };
  }

  return {
    ok: false,
    code: readErrorCode(response.payload, knownErrorCodes, fallbackErrorCode),
  };
}

/** Same as `read`, but wraps the success value under `key` — see `mutateNamed`. */
async function readNamed<
  TKey extends string,
  TValue,
  TErrorCode extends string,
>(
  key: TKey,
  url: string,
  readSuccessValue: (payload: unknown) => TValue | null,
  knownErrorCodes: readonly TErrorCode[],
  fallbackErrorCode: TErrorCode,
): Promise<
  ({ ok: true } & Record<TKey, TValue>) | { ok: false; code: TErrorCode }
> {
  const result = await read(
    url,
    readSuccessValue,
    knownErrorCodes,
    fallbackErrorCode,
  );
  if (!result.ok) {
    return result;
  }
  return { ok: true, [key]: result.value } as { ok: true } & Record<
    TKey,
    TValue
  >;
}

export const versionedJsonMutationService = {
  isRecord,
  mutate,
  mutateNamed,
  read,
  readErrorCode,
  readNamed,
  readVersionConflict,
  send,
} as const;
