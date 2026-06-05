export const WebApiEndpoint = {
  ContactSubmit: "/api/public/contact",
  LinkedInPostGenerate: "/api/public/generator/linkedin-post",
  LinkedInPostDeliver: "/api/public/generator/linkedin-post/deliver",
} as const;

export type WebApiEndpoint =
  (typeof WebApiEndpoint)[keyof typeof WebApiEndpoint];
