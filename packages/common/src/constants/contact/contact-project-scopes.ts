export const CONTACT_PROJECT_SCOPE = {
  BusinessWebsite: "business_website",
  CompactWebsite: "compact_website",
  LandingPage: "landing_page",
  Unsure: "unsure",
} as const;

export const CONTACT_PROJECT_SCOPES = [
  CONTACT_PROJECT_SCOPE.Unsure,
  CONTACT_PROJECT_SCOPE.LandingPage,
  CONTACT_PROJECT_SCOPE.CompactWebsite,
  CONTACT_PROJECT_SCOPE.BusinessWebsite,
] as const;

export type ContactProjectScope = (typeof CONTACT_PROJECT_SCOPES)[number];

export function isContactProjectScope(
  value: unknown,
): value is ContactProjectScope {
  return CONTACT_PROJECT_SCOPES.some((scope) => scope === value);
}
