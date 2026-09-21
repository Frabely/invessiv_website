import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { ProjectLineItemValue } from "@invessiv/common/contracts/crm/project-line-item-value";

/**
 * Everything the cockpit needs to render services for the projects of one customer. The page
 * resolves the two id lists with `canOn` per project, so a project the actor may not read is
 * never distinguishable from one without services.
 */
export type ProjectLineItemsViewModel = {
  /** Services of every readable project of the customer, oldest first per project. */
  services: readonly ProjectLineItemDto[];
  readableProjectIds: readonly string[];
  writableProjectIds: readonly string[];
  /** Active catalog templates; the only source for a new assignment. */
  assignableTemplates: readonly LineItemTemplateDto[];
  /** Null when the actor may not open the catalog. */
  catalogHref: string | null;
  /** Values are calculated server-side from confirmed items only. */
  customerValue: ProjectLineItemValue;
  /** Project ids without confirmed items map to zero values. */
  valuesByProjectId: Readonly<Record<string, ProjectLineItemValue>>;
};
