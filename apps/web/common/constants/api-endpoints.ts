export const WebApiEndpoint = {
  ContactSubmit: "/api/public/contact",
  LinkedInPostGenerate: "/api/public/generator/linkedin-post",
} as const;

export type WebApiEndpoint =
  (typeof WebApiEndpoint)[keyof typeof WebApiEndpoint];
