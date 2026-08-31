export const COMPANY = {
  brandName: "Invessiv",
  legalName: "Moritz Hecht – Invessiv",
  owner: "Moritz Hecht",
  legalForm: {
    de: "Einzelunternehmen (Nebentätigkeit)",
    en: "Sole proprietorship (part-time)",
  },
  address: {
    street: "Frankenberger Straße 235",
    postalCode: "09131",
    city: "Chemnitz",
    country: {
      de: "Deutschland",
      en: "Germany",
    },
  },
  contact: {
    email: "service@invessiv.com",
    phoneHref: "+4915232070477",
    phoneDisplayDe: "+49 1523 2070477",
    phoneDisplayEn: "+49 1523 2070477",
  },
} as const;

export const COMPANY_SOCIAL_LINKEDIN =
  "https://www.linkedin.com/in/moritz-hecht-4a5200235/";
export const COMPANY_SOCIAL_INSTAGRAM = "https://www.instagram.com/invessiv/";
export const COMPANY_CALENDLY =
  "https://calendly.com/service-invessiv-cxf5/30min";

export const COMPANY_MAILTO = `mailto:${COMPANY.contact.email}`;
export const COMPANY_TEL = `tel:${COMPANY.contact.phoneHref}`;
