import type { CreateProjectRequestDto } from "../create-project-request.dto";
import type { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
export type AcceptServiceRequestProjectTargetDto =
  | {
      /** Assign an existing project. */
      mode: typeof ServiceRequestProjectWish.Existing;
      /** Project of this request's customer. */
      projectId: string;
    }
  | {
      /** Create a project atomically. */
      mode: typeof ServiceRequestProjectWish.New;
      /** Validated project fields. */
      project: CreateProjectRequestDto;
    };
