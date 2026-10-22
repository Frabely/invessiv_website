export const AnalyticsTarget = {
  ContactForm: "contact_form",
  ContactEmail: "contact_email",
  Services: "services",
  Process: "process",
  References: "references",
  LandingPage: "landing_page",
  Generator: "generator",
  External: "external",
} as const;

export type AnalyticsTarget =
  (typeof AnalyticsTarget)[keyof typeof AnalyticsTarget];
