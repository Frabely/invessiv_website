export const CONTACT_REQUEST_KIND = {
  DiscoveryCall: "discovery_call",
  ProjectRequest: "project_request",
  QuickContact: "quick_contact",
  LinkedInPostDelivery: "linkedin_post_delivery",
} as const;

export const CONTACT_REQUEST_KINDS = [
  CONTACT_REQUEST_KIND.ProjectRequest,
  CONTACT_REQUEST_KIND.QuickContact,
  CONTACT_REQUEST_KIND.DiscoveryCall,
  CONTACT_REQUEST_KIND.LinkedInPostDelivery,
] as const;

export type ContactRequestKind = (typeof CONTACT_REQUEST_KINDS)[number];
