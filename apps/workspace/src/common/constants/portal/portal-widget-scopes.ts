/** Whether a widget shows company-wide data or follows the selected project tab. */
export const PortalWidgetScope = {
  Customer: "customer",
  Project: "project",
} as const;

export type PortalWidgetScope =
  (typeof PortalWidgetScope)[keyof typeof PortalWidgetScope];
