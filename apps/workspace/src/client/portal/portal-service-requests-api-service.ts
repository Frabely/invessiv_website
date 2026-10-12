import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import {
  PORTAL_SERVICE_REQUEST_ERROR_CODE_VALUES,
  PortalServiceRequestErrorCode,
} from "@invessiv/common/constants/portal/portal-service-request-error-codes";
import type { CreatePortalServiceRequestDto } from "@invessiv/common/contracts/portal/create-portal-service-request.dto";
import { versionedJsonMutationService as json } from "@/client/shared/versioned-json-mutation-service";
import type { JsonClientResult } from "@/common/contracts/client/json-client-result";
import { readApiErrorCode } from "@/common/patterns/client/read-api-error-code";
import {
  portalServiceRequestsEndpoint,
  portalServiceRequestWithdrawEndpoint,
} from "@/common/patterns/portal/portal-api-endpoints";

const ConfirmedFlag = {
  Created: "created",
  Withdrawn: "withdrawn",
} as const;
type ConfirmedFlag = (typeof ConfirmedFlag)[keyof typeof ConfirmedFlag];

type ConfirmedResult = JsonClientResult<true, PortalServiceRequestErrorCode>;

/** Both commands only confirm; the dashboard reloads to show the changed list. */
function post(
  endpoint: string,
  body: unknown,
  flag: ConfirmedFlag,
): Promise<ConfirmedResult> {
  return json.request(
    endpoint,
    HttpMethod.Post,
    body,
    (payload) =>
      json.isRecord(payload) && payload[flag] === true ? true : null,
    (payload) =>
      readApiErrorCode(
        payload,
        PORTAL_SERVICE_REQUEST_ERROR_CODE_VALUES,
        PortalServiceRequestErrorCode.Internal,
      ),
    PortalServiceRequestErrorCode.Internal,
  );
}

/** The company is the one in the URL the portal gate verified; the body never names one. */
function createRequest(
  customerId: string,
  input: CreatePortalServiceRequestDto,
): Promise<ConfirmedResult> {
  return post(
    portalServiceRequestsEndpoint(customerId),
    input,
    ConfirmedFlag.Created,
  );
}

function withdrawRequest(
  customerId: string,
  requestId: string,
): Promise<ConfirmedResult> {
  return post(
    portalServiceRequestWithdrawEndpoint(customerId, requestId),
    undefined,
    ConfirmedFlag.Withdrawn,
  );
}

export const portalServiceRequestsApiService = {
  createRequest,
  withdrawRequest,
} as const;
