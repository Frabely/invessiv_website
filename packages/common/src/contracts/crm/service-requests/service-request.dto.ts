import type { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import type { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
export interface ServiceRequestDto {
  /** Request identifier. */
  id: string;
  /** Customer owning the request. */
  customerId: string;
  /** Customer display name. */
  customerDisplayName: string;
  /** Customer number for display. */
  customerNumber: number;
  /** Catalog provenance, null for free text or a deleted template. */
  lineItemTemplateId: string | null;
  /** Requested kind, fixed at submission. */
  kind: LineItemKind;
  /** Requested service title snapshot. */
  title: string;
  /** Customer text, rendered as plain text. */
  note: string;
  /** Requested hours in minutes, present only for hours. */
  requestedMinutes: number | null;
  /** Customer preference, independent of the final assignment. */
  projectWish: ServiceRequestProjectWish;
  /** Customer's preferred existing project. */
  requestedProjectId: string | null;
  /** Preferred project title when readable. */
  requestedProjectTitle: string | null;
  /** Contact display name. */
  requestedByName: string;
  /** Current request lifecycle. */
  status: ServiceRequestStatus;
  /** Customer-visible rejection reason. */
  declineReason: string | null;
  /** Time when an offer was marked sent. */
  offeredAt: string | null;
  /** Offered price in cents (hourly rate for hours); null before an offer and on offers recorded without one. */
  offeredPriceCents: number | null;
  /** Offered hours in minutes; only on an offered hours request. */
  offeredMinutes: number | null;
  /** Time of acceptance, rejection or withdrawal. */
  decidedAt: string | null;
  /** Final project after acceptance. */
  projectId: string | null;
  /** Assigned project snapshot after acceptance. */
  projectLineItemId: string | null;
  /** Optimistic concurrency version. */
  version: number;
  /** Submission time in ISO format. */
  createdAt: string;
}
