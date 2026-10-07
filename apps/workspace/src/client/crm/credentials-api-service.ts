import {
  CREDENTIAL_API_ERROR_CODE_VALUES,
  CredentialApiErrorCode,
} from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import type { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { CreateCredentialRequestDto } from "@invessiv/common/contracts/credentials/create-credential-request.dto";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import type { UpdateCredentialRequestDto } from "@invessiv/common/contracts/credentials/update-credential-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import {
  CREDENTIAL_CUSTOMER_WIDE_QUERY_VALUE,
  CredentialQueryParam,
} from "@/common/constants/credentials/credential-query-params";
import type { VersionedJsonMutationResult } from "@/common/contracts/client/versioned-json-mutation-result";
import type { CredentialClientResult } from "@/common/contracts/credentials/credential-client-result";
import type { CredentialDeleteClientResult } from "@/common/contracts/credentials/credential-delete-client-result";
import {
  crmCredentialEndpoint,
  crmCredentialRevealEndpoint,
  crmCustomerCredentialsEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

const { isRecord, readVersionConflict, send } = versionedJsonMutationService;
type JsonResponse = NonNullable<Awaited<ReturnType<typeof send>>>;
type CredentialMutationResult = VersionedJsonMutationResult<
  CredentialDto,
  CredentialApiErrorCode
>;

const INTERNAL = { ok: false, code: CredentialApiErrorCode.Internal } as const;

function isCredential(value: unknown): value is CredentialDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.version === "number" &&
    isRecord(value.capabilities)
  );
}

function readCode(payload: unknown): CredentialApiErrorCode {
  const code = isRecord(payload) ? payload.code : undefined;
  return (
    CREDENTIAL_API_ERROR_CODE_VALUES.find((known) => known === code) ??
    CredentialApiErrorCode.Internal
  );
}

function readWriteFailure(response: JsonResponse) {
  const current = readVersionConflict(response, isCredential);
  return current
    ? ({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current,
      } as const)
    : ({ ok: false, code: readCode(response.payload) } as const);
}

/** `projectId` undefined lists everything readable, null only customer-wide entries. */
async function list(
  customerId: string,
  projectId: string | null | undefined,
): Promise<CredentialClientResult<CredentialDto[]>> {
  const params = new URLSearchParams();
  if (projectId !== undefined)
    params.set(
      CredentialQueryParam.ProjectId,
      projectId ?? CREDENTIAL_CUSTOMER_WIDE_QUERY_VALUE,
    );
  const query = params.toString();
  const endpoint = crmCustomerCredentialsEndpoint(customerId);
  const response = await send(
    query ? `${endpoint}?${query}` : endpoint,
    HttpMethod.Get,
    undefined,
  );
  if (!response) return INTERNAL;
  const credentials = isRecord(response.payload)
    ? response.payload.credentials
    : undefined;
  return response.ok &&
    Array.isArray(credentials) &&
    credentials.every(isCredential)
    ? { ok: true, value: credentials }
    : { ok: false, code: readCode(response.payload) };
}

async function create(
  customerId: string,
  input: CreateCredentialRequestDto,
): Promise<CredentialClientResult<CredentialDto>> {
  const response = await send(
    crmCustomerCredentialsEndpoint(customerId),
    HttpMethod.Post,
    input,
  );
  if (!response) return INTERNAL;
  return response.ok && isCredential(response.payload)
    ? { ok: true, value: response.payload }
    : { ok: false, code: readCode(response.payload) };
}

async function update(
  credentialId: string,
  input: UpdateCredentialRequestDto,
): Promise<CredentialMutationResult> {
  const response = await send(
    crmCredentialEndpoint(credentialId),
    HttpMethod.Patch,
    input,
  );
  if (!response) return INTERNAL;
  return response.ok && isCredential(response.payload)
    ? { ok: true, value: response.payload }
    : readWriteFailure(response);
}

async function remove(
  credentialId: string,
  version: number,
): Promise<CredentialDeleteClientResult> {
  const response = await send(
    crmCredentialEndpoint(credentialId),
    HttpMethod.Delete,
    { version },
  );
  if (!response) return INTERNAL;
  return response.ok ? { ok: true } : readWriteFailure(response);
}

/** One field per call. The value goes straight to the caller and is kept nowhere in between. */
async function reveal(
  credentialId: string,
  field: CredentialSecretField,
  intent: CredentialRevealIntent,
): Promise<CredentialClientResult<string>> {
  const response = await send(
    crmCredentialRevealEndpoint(credentialId),
    HttpMethod.Post,
    { field, intent },
  );
  if (!response) return INTERNAL;
  const value = isRecord(response.payload) ? response.payload.value : undefined;
  return response.ok && typeof value === "string"
    ? { ok: true, value }
    : { ok: false, code: readCode(response.payload) };
}

export const credentialsApiService = {
  list,
  create,
  update,
  remove,
  reveal,
} as const;
