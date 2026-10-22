export const AnalyticsArea = {
  Header: "header",
  HeaderMobile: "header_mobile",
  Footer: "footer",
  Contact: "contact",
  Faq: "faq",
} as const;

export type AnalyticsArea = (typeof AnalyticsArea)[keyof typeof AnalyticsArea];
