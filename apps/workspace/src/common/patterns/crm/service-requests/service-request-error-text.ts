import type { ServiceRequestErrorCode } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
export function serviceRequestErrorText(
  code: ServiceRequestErrorCode,
  content: CrmServiceRequestsDictionary,
): string {
  return content.errors[code];
}
