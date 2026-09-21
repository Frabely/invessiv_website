export const LineItemTemplateStatus = {
  Active: "active",
  Archived: "archived",
} as const;

export type LineItemTemplateStatus =
  (typeof LineItemTemplateStatus)[keyof typeof LineItemTemplateStatus];

export const LINE_ITEM_TEMPLATE_STATUS_VALUES = [
  LineItemTemplateStatus.Active,
  LineItemTemplateStatus.Archived,
] as const;
