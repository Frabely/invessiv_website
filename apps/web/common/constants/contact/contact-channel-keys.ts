export const CONTACT_CHANNEL_KEY = {
  Email: "email",
  Instagram: "instagram",
  Linkedin: "linkedin",
  Phone: "phone",
} as const;

export const CONTACT_CHANNEL_KEYS = [
  CONTACT_CHANNEL_KEY.Email,
  CONTACT_CHANNEL_KEY.Phone,
  CONTACT_CHANNEL_KEY.Linkedin,
  CONTACT_CHANNEL_KEY.Instagram,
] as const;

export type ContactChannelKey = (typeof CONTACT_CHANNEL_KEYS)[number];
