import type { AcceptServiceRequestProjectTargetDto } from "./accept-service-request-project-target.dto";
import type { AcceptServiceRequestTemplateSourceDto } from "./accept-service-request-template-source.dto";
import type { AcceptServiceRequestLineItemDto } from "./accept-service-request-line-item.dto";
export interface AcceptServiceRequestRequestDto {
  /** Expected request version. */
  version: number;
  /** Final assignment target. */
  project: AcceptServiceRequestProjectTargetDto;
  /** Active or newly created catalog source. */
  template: AcceptServiceRequestTemplateSourceDto;
  /** Editable snapshot and hours effect. */
  lineItem: AcceptServiceRequestLineItemDto;
}
