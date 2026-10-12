import type { CreateLineItemTemplateRequestDto } from "../create-line-item-template-request.dto";
import type { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
export type AcceptServiceRequestTemplateSourceDto =
  | {
      /** Use an active catalog entry. */
      mode: typeof ServiceRequestProjectWish.Existing;
      /** Active entry of the requested kind. */
      lineItemTemplateId: string;
    }
  | {
      /** Create an internal catalog entry atomically. */
      mode: typeof ServiceRequestProjectWish.New;
      /** New standard template fields. */
      template: CreateLineItemTemplateRequestDto;
    };
