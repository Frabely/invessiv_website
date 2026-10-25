export const TRUST_POINT_ICON_KEY = {
  DirectContact: "directContact",
  DownloadIncluded: "downloadIncluded",
  Free: "free",
  NoAccount: "noAccount",
  NoAgencyLoop: "noAgencyLoop",
  SoftwareBackground: "softwareBackground",
} as const;

export type TrustPointIconKey =
  (typeof TRUST_POINT_ICON_KEY)[keyof typeof TRUST_POINT_ICON_KEY];
