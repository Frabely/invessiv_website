/**
 * The English path segments every portal module renders under `/portal/[customerId]/…`. Fixed
 * here so a module's route and its `PORTAL_NAV_ITEMS` entry can never drift onto different slugs.
 */
export const PortalSection = {
  Projects: "projects",
  Files: "files",
  Assets: "assets",
  Messages: "messages",
  Onboarding: "onboarding",
  Services: "services",
} as const;

export type PortalSection = (typeof PortalSection)[keyof typeof PortalSection];

export const PORTAL_SECTION_VALUES = [
  PortalSection.Projects,
  PortalSection.Files,
  PortalSection.Assets,
  PortalSection.Messages,
  PortalSection.Onboarding,
  PortalSection.Services,
] as const;
