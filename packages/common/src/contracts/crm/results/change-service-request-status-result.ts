import type { ServiceRequestErrorCode } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { ServiceRequestDto } from "../service-requests/service-request.dto";
export type ChangeServiceRequestStatusResult =
  | { ok: true; request: ServiceRequestDto }
  | {
      ok: false;
      code: ServiceRequestErrorCode;
      conflict?: VersionConflictDto<ServiceRequestDto>;
    };
