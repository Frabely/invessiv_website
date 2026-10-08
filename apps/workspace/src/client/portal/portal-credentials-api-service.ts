import {
  CREDENTIAL_API_ERROR_CODE_VALUES,
  CredentialApiErrorCode,
} from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import type { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreatePortalCredentialRequestDto } from "@invessiv/common/contracts/portal/create-portal-credential-request.dto";
import type { PortalCredentialListDto } from "@invessiv/common/contracts/portal/portal-credential-list.dto";
import type { PortalCredentialDto } from "@invessiv/common/contracts/portal/portal-credential.dto";
import type { UpdatePortalCredentialRequestDto } from "@invessiv/common/contracts/portal/update-portal-credential-request.dto";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { PortalCredentialMutationResult } from "@/common/contracts/credentials/portal-credential-mutation-result";
import type { CredentialClientResult } from "@/common/contracts/credentials/credential-client-result";
import { readApiErrorCode } from "@/common/patterns/client/read-api-error-code";
import {
  portalCredentialEndpoint,
  portalCredentialRevealEndpoint,
  portalCredentialsEndpoint,
} from "@/common/patterns/portal/portal-api-endpoints";

const { isRecord } = versionedJsonMutationService;

const SavedFlag = {
  Created: "created",
  Updated: "updated",
} as const;
type SavedFlag = (typeof SavedFlag)[keyof typeof SavedFlag];

function isCredential(value: unknown): value is PortalCredentialDto {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.id !== "string") {
    return false;
  }
  if (typeof value.title !== "string") {
    return false;
  }
  if (typeof value.version !== "number") {
    return false;
  }

  return typeof value.createdByCustomer === "boolean";
}

function readCode(payload: unknown): CredentialApiErrorCode {
  return readApiErrorCode(
    payload,
    CREDENTIAL_API_ERROR_CODE_VALUES,
    CredentialApiErrorCode.Internal,
  );
}

/**
 * The saved entry of a write answer, or null when the server only confirms (a contact who may
 * write but not list). `undefined` means the answer is not a confirmation at all.
 */
function readSaved(
  payload: unknown,
  flag: SavedFlag,
): PortalCredentialDto | null | undefined {
  if (!isRecord(payload) || payload[flag] !== true) {
    return undefined;
  }

  const credential = payload.credential;
  if (credential === null) {
    return null;
  }
  if (!isCredential(credential)) {
    return undefined;
  }

  return credential;
}

function isList(value: unknown): value is PortalCredentialListDto {
  if (!isRecord(value)) {
    return false;
  }

  if (!Array.isArray(value.credentials)) {
    return false;
  }
  if (!value.credentials.every(isCredential)) {
    return false;
  }
  if (!Array.isArray(value.projects)) {
    return false;
  }
  if (!isRecord(value.capabilities)) {
    return false;
  }

  return typeof value.configured === "boolean";
}

function isVersionConflict(
  payload: unknown,
): payload is VersionConflictDto<PortalCredentialDto | null> {
  if (!isRecord(payload)) {
    return false;
  }
  if (payload.code !== ConcurrencyErrorCode.VersionConflict) {
    return false;
  }

  const { currentVersion, current } = payload;
  if (typeof currentVersion !== "number") {
    return false;
  }
  if (!Number.isInteger(currentVersion)) {
    return false;
  }
  if (currentVersion <= 0) {
    return false;
  }

  return current === null || isCredential(current);
}

/** Metadata only; the dialog asks for it when it opens. */
async function list(
  customerId: string,
): Promise<CredentialClientResult<PortalCredentialListDto>> {
  return versionedJsonMutationService.request(
    portalCredentialsEndpoint(customerId),
    HttpMethod.Get,
    undefined,
    (payload) => (isList(payload) ? payload : null),
    readCode,
    CredentialApiErrorCode.Internal,
  );
}

/** The company is the one in the URL the portal gate verified; the body never names one. */
async function create(
  customerId: string,
  input: CreatePortalCredentialRequestDto,
): Promise<CredentialClientResult<PortalCredentialDto | null>> {
  const response = await versionedJsonMutationService.send(
    portalCredentialsEndpoint(customerId),
    HttpMethod.Post,
    input,
  );
  if (!response) {
    return { ok: false, code: CredentialApiErrorCode.Internal };
  }
  if (!response.ok) {
    return { ok: false, code: readCode(response.payload) };
  }

  const saved = readSaved(response.payload, SavedFlag.Created);
  if (saved === undefined) {
    return { ok: false, code: readCode(response.payload) };
  }

  return { ok: true, value: saved };
}

async function update(
  customerId: string,
  credentialId: string,
  input: UpdatePortalCredentialRequestDto,
): Promise<PortalCredentialMutationResult> {
  const response = await versionedJsonMutationService.send(
    portalCredentialEndpoint(customerId, credentialId),
    HttpMethod.Patch,
    input,
  );
  if (!response) {
    return { ok: false, code: CredentialApiErrorCode.Internal };
  }
  if (response.ok) {
    const saved = readSaved(response.payload, SavedFlag.Updated);
    if (saved !== undefined) {
      return { ok: true, value: saved };
    }
  }

  const payload = response.payload;
  if (
    response.status === HttpResponseCode.Conflict &&
    isVersionConflict(payload)
  ) {
    return {
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: payload.current,
      currentVersion: payload.currentVersion,
    };
  }
  return { ok: false, code: readCode(payload) };
}

/** One field per call. The value goes straight to the caller and is kept nowhere in between. */
async function reveal(
  customerId: string,
  credentialId: string,
  field: CredentialSecretField,
  intent: CredentialRevealIntent,
): Promise<CredentialClientResult<string>> {
  return versionedJsonMutationService.request(
    portalCredentialRevealEndpoint(customerId, credentialId),
    HttpMethod.Post,
    { field, intent },
    (payload) =>
      isRecord(payload) && typeof payload.value === "string"
        ? payload.value
        : null,
    readCode,
    CredentialApiErrorCode.Internal,
  );
}

export const portalCredentialsApiService = {
  list,
  create,
  update,
  reveal,
} as const;
