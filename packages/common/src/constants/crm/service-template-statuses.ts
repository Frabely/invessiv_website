export const ServiceTemplateStatus = {
  Active: "active",
  Archived: "archived",
} as const;

export type ServiceTemplateStatus =
  (typeof ServiceTemplateStatus)[keyof typeof ServiceTemplateStatus];

export const SERVICE_TEMPLATE_STATUS_VALUES = [
  ServiceTemplateStatus.Active,
  ServiceTemplateStatus.Archived,
] as const;
