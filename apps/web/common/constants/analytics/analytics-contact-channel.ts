export const AnalyticsContactChannel = {
  Email: "email",
  Phone: "phone",
  WhatsApp: "whatsapp",
  LinkedIn: "linkedin",
  Instagram: "instagram",
  Calendly: "calendly",
} as const;

export type AnalyticsContactChannel =
  (typeof AnalyticsContactChannel)[keyof typeof AnalyticsContactChannel];
