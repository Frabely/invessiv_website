import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";

export type ListLineItemTemplatesResult = {
  /** Whether at least one template exists at all, independent of the archived filter. */
  hasLineItemTemplates: boolean;
  /** Current page after clamping an out-of-range request. */
  page: number;
  /** Fixed number of template rows requested per page. */
  perPage: number;
  /** Rows on the current page, matching the current `includeArchived` filter. */
  rows: LineItemTemplateDto[];
  /** Number of templates matching the current `includeArchived` filter. */
  total: number;
};
