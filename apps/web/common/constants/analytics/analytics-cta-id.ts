export const AnalyticsCtaId = {
  HeaderPrimary: "header_primary",
  HomeHeroPrimary: "home_hero_primary",
  HomeHeroSecondary: "home_hero_secondary",
  HomeUspReply: "home_usp_reply",
  HomeServicesSelect: "home_services_select",
  HomeServicesDetails: "home_services_details",
  HomeProcessPrimary: "home_process_primary",
  HomeFaqContact: "home_faq_contact",
  FooterContact: "footer_contact",
  ReferencesClosingPrimary: "references_closing_primary",
  ReferencesClosingSecondary: "references_closing_secondary",
  SuccessCalendar: "success_calendar",
  LandingHeroPrimary: "landing_hero_primary",
  LandingHeroSecondary: "landing_hero_secondary",
  LandingTrustReply: "landing_trust_reply",
  LandingAudiencePrimary: "landing_audience_primary",
  LandingPricingPrimary: "landing_pricing_primary",
  LandingFaqContact: "landing_faq_contact",
  LandingFaqServices: "landing_faq_services",
  LinkedInHeroPrimary: "linkedin_hero_primary",
  LinkedInHeroSecondary: "linkedin_hero_secondary",
} as const;

export type AnalyticsCtaId =
  (typeof AnalyticsCtaId)[keyof typeof AnalyticsCtaId];
