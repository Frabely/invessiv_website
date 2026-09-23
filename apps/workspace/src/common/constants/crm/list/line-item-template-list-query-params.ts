export const LineItemTemplateListQueryParam = {
  Mode: "mode",
  Edit: "edit",
  IncludeArchived: "includeArchived",
  Page: "page",
} as const;

export type LineItemTemplateListQueryParam =
  (typeof LineItemTemplateListQueryParam)[keyof typeof LineItemTemplateListQueryParam];
