import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";

/** The origin filter of the portal files page: both origins, or one of them. */
export const PortalFileOriginFilter = {
  All: "all",
  FromUs: PortalFileOrigin.FromUs,
  FromYou: PortalFileOrigin.FromYou,
} as const;

export type PortalFileOriginFilter =
  (typeof PortalFileOriginFilter)[keyof typeof PortalFileOriginFilter];

export const PORTAL_FILE_ORIGIN_FILTER_VALUES = [
  PortalFileOriginFilter.All,
  PortalFileOriginFilter.FromUs,
  PortalFileOriginFilter.FromYou,
] as const;
