import type { LineItemKind } from "../../constants/crm/line-item-kinds";
import type { ServiceRequestProjectWish } from "../../constants/crm/service-request-project-wishes";
import type { ServiceRequestStatus } from "../../constants/crm/service-request-statuses";

/**
 * A request of the reader's company. Carries no price, no version and no ids of the catalog entry,
 * the resulting project service or the people involved.
 */
export interface PortalServiceRequestDto {
  /** Id of the request; withdrawing addresses it. */
  id: string;
  /** Catalog title at the time of the request, or the contact's own words for a free-text request. */
  title: string;
  /** What the contact wrote; an empty string when a catalog request came without a note. Plain text. */
  note: string;
  /** Snapshot of the service kind; a free-text request is always `standard`. */
  kind: LineItemKind;
  /** Requested hours in minutes; null for every kind but `hours`. */
  requestedMinutes: number | null;
  /** What the contact said about the project; the team decides the final target when accepting. */
  projectWish: ServiceRequestProjectWish;
  /** Title of the project the request ended up in, else of the wished one. Null without either and for a project the portal does not show. */
  projectTitle: string | null;
  /** Shown as a badge with text, never as colour alone. */
  status: ServiceRequestStatus;
  /** The team's reason, written for the customer; null unless the request was declined. Plain text. */
  declineReason: string | null;
  /** ISO timestamp of the request. */
  createdAt: string;
  /** True while the request can still be withdrawn and the reader may request; never in the owner view. */
  canWithdraw: boolean;
}
