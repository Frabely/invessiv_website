import {
  CREDENTIAL_API_ERROR_CODE_VALUES,
  CredentialApiErrorCode,
} from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import type { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { CreateCredentialRequestDto } from "@invessiv/common/contracts/credentials/create-credential-request.dto";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import type { SetCredentialPortalVisibilityRequestDto } from "@invessiv/common/contracts/credentials/set-credential-portal-visibility-request.dto";
import type { UpdateCredentialRequestDto } from "@invessiv/common/contracts/credentials/update-credential-request.dto";
import { readApiErrorCode } from "@/common/patterns/client/read-api-error-code";
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
  crmCredentialPortalVisibilityEndpoint,
  crmCredentialRevealEndpoint,
  crmCustomerCredentialsEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

const { isRecord } = versionedJsonMutationService;
type CredentialMutationResult = VersionedJsonMutationResult<
  CredentialDto,
  CredentialApiErrorCode
>;

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
  return readApiErrorCode(
    payload,
    CREDENTIAL_API_ERROR_CODE_VALUES,
    CredentialApiErrorCode.Internal,
  );
}

function request<T>(
  url: string,
  method: HttpMethod,
  body: unknown,
  read: (payload: unknown) => T | null,
) {
  return versionedJsonMutationService.request(
    url,
    method,
    body,
    read,
    readCode,
    CredentialApiErrorCode.Internal,
  );
}

const readCredential = (payload: unknown) =>
  isCredential(payload) ? payload : null;

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
  return request(
    query ? `${endpoint}?${query}` : endpoint,
    HttpMethod.Get,
    undefined,
    (payload) => {
      const credentials = isRecord(payload) ? payload.credentials : undefined;
      return Array.isArray(credentials) && credentials.every(isCredential)
        ? credentials
        : null;
    },
  );
}

async function create(
  customerId: string,
  input: CreateCredentialRequestDto,
): Promise<CredentialClientResult<CredentialDto>> {
  return request(
    crmCustomerCredentialsEndpoint(customerId),
    HttpMethod.Post,
    input,
    readCredential,
  );
}

async function update(
  credentialId: string,
  input: UpdateCredentialRequestDto,
): Promise<CredentialMutationResult> {
  return versionedJsonMutationService.mutate(
    crmCredentialEndpoint(credentialId),
    HttpMethod.Patch,
    input,
    readCredential,
    isCredential,
    CREDENTIAL_API_ERROR_CODE_VALUES,
    CredentialApiErrorCode.Internal,
    readCode,
  );
}

async function setPortalVisibility(
  credentialId: string,
  input: SetCredentialPortalVisibilityRequestDto,
): Promise<CredentialMutationResult> {
  return versionedJsonMutationService.mutate(
    crmCredentialPortalVisibilityEndpoint(credentialId),
    HttpMethod.Patch,
    input,
    readCredential,
    isCredential,
    CREDENTIAL_API_ERROR_CODE_VALUES,
    CredentialApiErrorCode.Internal,
    readCode,
  );
}

async function remove(
  credentialId: string,
  version: number,
): Promise<CredentialDeleteClientResult> {
  return versionedJsonMutationService.remove(
    crmCredentialEndpoint(credentialId),
    { version },
    isCredential,
    readCode,
    CredentialApiErrorCode.Internal,
  );
}

/** One field per call. The value goes straight to the caller and is kept nowhere in between. */
async function reveal(
  credentialId: string,
  field: CredentialSecretField,
  intent: CredentialRevealIntent,
): Promise<CredentialClientResult<string>> {
  return request(
    crmCredentialRevealEndpoint(credentialId),
    HttpMethod.Post,
    { field, intent },
    (payload) =>
      isRecord(payload) && typeof payload.value === "string"
        ? payload.value
        : null,
  );
}

export const credentialsApiService = {
  list,
  create,
  update,
  setPortalVisibility,
  remove,
  reveal,
} as const;
