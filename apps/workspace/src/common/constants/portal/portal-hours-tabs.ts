/** The tabs of the hours overview below the projects, in the order they appear. */
export const PortalHoursTab = {
  Entries: "entries",
  Purchases: "purchases",
} as const;

export type PortalHoursTab =
  (typeof PortalHoursTab)[keyof typeof PortalHoursTab];

export const PORTAL_HOURS_TAB_VALUES = [
  PortalHoursTab.Entries,
  PortalHoursTab.Purchases,
] as const;
