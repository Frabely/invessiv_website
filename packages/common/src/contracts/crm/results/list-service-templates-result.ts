import type { ServiceTemplateDto } from "@invessiv/common/contracts/crm/service-template.dto";

export type ListServiceTemplatesResult = {
  /** Whether at least one template exists at all, independent of the archived filter. */
  hasServiceTemplates: boolean;
  /** Rows matching the current `includeArchived` filter. */
  rows: ServiceTemplateDto[];
};
