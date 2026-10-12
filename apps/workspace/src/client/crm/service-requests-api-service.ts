import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import {
  SERVICE_REQUEST_ERROR_CODE_VALUES,
  ServiceRequestErrorCode as E,
} from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { ChangeServiceRequestStatusRequestDto } from "@invessiv/common/contracts/crm/service-requests/change-service-request-status-request.dto";
import type { AcceptServiceRequestRequestDto } from "@invessiv/common/contracts/crm/service-requests/accept-service-request-request.dto";
import {
  crmServiceRequestStatusEndpoint,
  crmServiceRequestAcceptEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";
import { versionedJsonMutationService as transport } from "@/client/shared/versioned-json-mutation-service";
function isRequest(value: unknown): value is ServiceRequestDto {
  return (
    transport.isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number"
  );
}
function mutate(
  url: string,
  method: HttpMethod,
  body: ChangeServiceRequestStatusRequestDto | AcceptServiceRequestRequestDto,
) {
  return transport.mutate(
    url,
    method,
    body,
    (value) => (isRequest(value) ? value : null),
    isRequest,
    SERVICE_REQUEST_ERROR_CODE_VALUES,
    E.Internal,
  );
}
function changeStatus(id: string, input: ChangeServiceRequestStatusRequestDto) {
  return mutate(crmServiceRequestStatusEndpoint(id), HttpMethod.Patch, input);
}
async function dialogMutation(
  url: string,
  method: HttpMethod,
  input: ChangeServiceRequestStatusRequestDto | AcceptServiceRequestRequestDto,
) {
  const result = await mutate(url, method, input);
  return result.ok ? { ok: true as const, current: result.value } : result;
}
async function decline(
  id: string,
  input: ChangeServiceRequestStatusRequestDto,
) {
  return dialogMutation(
    crmServiceRequestStatusEndpoint(id),
    HttpMethod.Patch,
    input,
  );
}
async function accept(id: string, input: AcceptServiceRequestRequestDto) {
  return dialogMutation(
    crmServiceRequestAcceptEndpoint(id),
    HttpMethod.Post,
    input,
  );
}
export const serviceRequestsApiService = {
  changeStatus,
  decline,
  accept,
} as const;
