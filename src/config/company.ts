export const COMPANY = {
  brandName: "Invessiv",
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

export const COMPANY_SOCIAL_LINKEDIN = "https://www.linkedin.com/company/invessiv";
export const COMPANY_SOCIAL_INSTAGRAM = "https://www.instagram.com/invessiv/";
export const COMPANY_SOCIAL_X = "https://x.com/invessiv";

export const COMPANY_ADDRESS_LINE_DE = `${COMPANY.address.street}, ${COMPANY.address.postalCode} ${COMPANY.address.city}, ${COMPANY.address.country.de}`;
export const COMPANY_ADDRESS_LINE_EN = `${COMPANY.address.street}, ${COMPANY.address.postalCode} ${COMPANY.address.city}, ${COMPANY.address.country.en}`;
export const COMPANY_MAILTO = `mailto:${COMPANY.contact.email}`;
export const COMPANY_TEL = `tel:${COMPANY.contact.phoneHref}`;