import type { ServiceRequestProjectWish } from "../../constants/crm/service-request-project-wishes";

/** What a contact sends to ask for a service. The company comes from the verified actor, never from here. */
export interface CreatePortalServiceRequestDto {
  /** Created once when the form opens; a repeated send answers with the request it already created. */
  idempotencyKey: string;
  /** The chosen catalog entry; null for a free-text request. */
  lineItemTemplateId: string | null;
  /** The contact's own title; must be null with a catalog entry, whose title the server takes over. */
  title: string | null;
  /** Required for free text, optional otherwise; an empty string when the contact wrote nothing. */
  note: string;
  /** Wished hours in minutes; required for an hours service and null for every other request. */
  requestedMinutes: number | null;
  /** Which project the contact has in mind; which answers a service allows is decided by `listPortalServiceProjectWishes`. */
  projectWish: ServiceRequestProjectWish;
  /** Required exactly when `projectWish` is `existing`; the server checks it against the service. */
  projectId: string | null;
}
