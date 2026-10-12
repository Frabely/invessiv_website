import type { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";

/** What the service request form holds while a contact fills it in; never sent as it is. */
export interface PortalServiceRequestFormValues {
  /** The contact's own title; only used for a free-text request. */
  title: string;
  /** Required description for free text, optional note for a catalog entry. */
  note: string;
  /** Whole hours as typed; only used for an hours service. An empty string means not chosen yet. */
  hours: string;
  /** Null until the contact answers a project question that has more than one answer. */
  projectWish: ServiceRequestProjectWish | null;
  /** Set exactly when `projectWish` is `existing`. */
  projectId: string | null;
}
