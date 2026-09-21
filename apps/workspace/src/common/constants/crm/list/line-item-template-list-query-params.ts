export const LineItemTemplateListQueryParam = {
  Mode: "mode",
  Edit: "edit",
  IncludeArchived: "includeArchived",
} as const;

export type LineItemTemplateListQueryParam =
  (typeof LineItemTemplateListQueryParam)[keyof typeof LineItemTemplateListQueryParam];
