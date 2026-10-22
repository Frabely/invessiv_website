import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";

export const AnalyticsFormId = {
  Contact: "contact",
  DiscoveryCall: CONTACT_REQUEST_KIND.DiscoveryCall,
  QuickContact: CONTACT_REQUEST_KIND.QuickContact,
} as const;

export type AnalyticsFormId =
  (typeof AnalyticsFormId)[keyof typeof AnalyticsFormId];

export const AnalyticsFormPlacement = {
  HomeContact: "home_contact",
  LandingFinal: "landing_final",
  LinkedInFinal: "linkedin_final",
} as const;

export type AnalyticsFormPlacement =
  (typeof AnalyticsFormPlacement)[keyof typeof AnalyticsFormPlacement];

export const AnalyticsFormFailureReason = {
  Delivery: "delivery",
  Generic: "generic",
  RateLimited: "rate_limited",
  Validation: "validation",
} as const;

export type AnalyticsFormFailureReason =
  (typeof AnalyticsFormFailureReason)[keyof typeof AnalyticsFormFailureReason];

export const AnalyticsCalendarSource = {
  AfterSubmit: "after_submit",
  SuccessPage: "success_page",
} as const;

export type AnalyticsCalendarSource =
  (typeof AnalyticsCalendarSource)[keyof typeof AnalyticsCalendarSource];
