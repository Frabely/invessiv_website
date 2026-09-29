/** The two portal tabs: what the team released, and what the customer added. */
export const PortalFileOrigin = {
  FromUs: "fromUs",
  FromYou: "fromYou",
} as const;

export type PortalFileOrigin =
  (typeof PortalFileOrigin)[keyof typeof PortalFileOrigin];

export const PORTAL_FILE_ORIGIN_VALUES = [
  PortalFileOrigin.FromUs,
  PortalFileOrigin.FromYou,
] as const;
