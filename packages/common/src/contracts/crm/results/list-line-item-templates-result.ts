import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";

export type ListLineItemTemplatesResult = {
  /** Whether at least one template exists at all, independent of the archived filter. */
  hasLineItemTemplates: boolean;
  /** Rows matching the current `includeArchived` filter. */
  rows: LineItemTemplateDto[];
};
