import type { LineItemTemplateRow } from "@invessiv/common/contracts/crm/rows/line-item-template-row";
import type { ServiceRequestRow } from "@invessiv/common/contracts/crm/rows/service-request-row";
import type { PortalServiceProjectOptionDto } from "@invessiv/common/contracts/portal/portal-service-project-option.dto";
import type { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { projects } from "@invessiv/db/record-configuration";

/** Project columns required to determine request eligibility, loaded once for all service kinds. */
export type PortalServiceProjectRow = Pick<
  typeof projects.$inferSelect,
  "id" | "title" | "status" | "feedback_round_positions"
>;

/** Only the request columns the portal mapping and open-round check actually consume. */
export type PortalServiceRequestReadRow = Pick<
  ServiceRequestRow,
  | "id"
  | "title"
  | "note"
  | "kind"
  | "requested_minutes"
  | "project_wish"
  | "requested_project_id"
  | "project_id"
  | "status"
  | "decline_reason"
  | "created_at"
>;

/** The only catalog columns the portal ever selects: no price, pricing mode, interval or internal text. */
export type PortalServiceCatalogRow = Pick<
  LineItemTemplateRow,
  "id" | "title" | "portal_description" | "kind" | "project_mode"
>;

/** Projects a request may name, per service kind, as `portalServiceRequestService.selectableProjects` answers them. */
export type PortalSelectableProjectsByKind = Readonly<
  Record<LineItemKind, readonly PortalServiceProjectOptionDto[]>
>;

/** Everything `getPortalServices` loaded, before the portal DTO is built from it. */
export type PortalServicesSource = {
  /** Catalog rows by title, already narrowed to `catalogCondition`. */
  catalogRows: readonly PortalServiceCatalogRow[];
  selectableProjects: PortalSelectableProjectsByKind;
  /** Newest first: every open request and the capped history of closed requests. */
  requestRows: readonly PortalServiceRequestReadRow[];
  canRequest: boolean;
};
