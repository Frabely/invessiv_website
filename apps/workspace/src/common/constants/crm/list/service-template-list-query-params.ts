export const ServiceTemplateListQueryParam = {
  Mode: "mode",
  Edit: "edit",
  IncludeArchived: "includeArchived",
} as const;

export type ServiceTemplateListQueryParam =
  (typeof ServiceTemplateListQueryParam)[keyof typeof ServiceTemplateListQueryParam];
