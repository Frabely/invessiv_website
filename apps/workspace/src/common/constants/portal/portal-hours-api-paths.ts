/** Path segments of the portal hours routes below `/api/portal/[customerId]`. */
export const PortalHoursApiPath = {
  Hours: "hours",
  Entries: "entries",
} as const;

export type PortalHoursApiPath =
  (typeof PortalHoursApiPath)[keyof typeof PortalHoursApiPath];
