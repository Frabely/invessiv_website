import type { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import type { LineItemFieldsFormValues } from "./line-item-fields-form-values";
import type { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
export type ServiceRequestAcceptFormValues = LineItemFieldsFormValues & {
  projectMode: ServiceRequestProjectWish;
  projectId: string;
  projectTitle: string;
  templateMode: ServiceRequestProjectWish;
  templateId: string;
  quantityInput: string;
  allocateHoursToProject: boolean;
  status: ProjectLineItemStatus;
  /** Ticked on purpose to accept before any offer was sent. */
  confirmedWithoutOffer: boolean;
};
