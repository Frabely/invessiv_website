import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";

/** Names the wished project when the actor may read it, otherwise the kind of wish. */
export function describeServiceRequestProjectWish(
  request: ServiceRequestDto,
  content: CrmServiceRequestsDictionary,
): string {
  return request.projectWish === ServiceRequestProjectWish.Existing
    ? (request.requestedProjectTitle ?? content.details.projectUnavailable)
    : content.wish[request.projectWish];
}
