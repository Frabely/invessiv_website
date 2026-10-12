import type { LineItemKind } from "../../constants/crm/line-item-kinds";
import type { LineItemProjectMode } from "../../constants/crm/line-item-project-modes";

/** A catalog entry the team released for requests. Never carries a price, pricing mode or interval. */
export interface PortalRequestableServiceDto {
  /** Id of the catalog entry; a request names it instead of a title of its own. */
  id: string;
  /** Catalog title, in the one language the catalog is kept in. */
  title: string;
  /** The text written for customers (`portal_description`), never the internal description. Rendered as plain text. */
  description: string;
  /** Decides what the form asks: an amount for hours, a project for a further feedback round. */
  kind: LineItemKind;
  /** Whether the service extends a project the company has or starts one of its own. */
  projectMode: LineItemProjectMode;
  /** Ids out of `PortalServicesDto.projects` this service can be requested for; empty when it starts a new project or none qualifies. */
  projectIds: string[];
}
