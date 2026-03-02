import { COMPANY } from "@/config/company";

export type MarketingRootMetaContent = {
  description: string;
  openGraphDescription: string;
  pageTitle: string;
  serviceDescription: string;
};

export const MARKETING_ROOT_META_CONTENT: MarketingRootMetaContent = {
  pageTitle: "Landing pages, websites, and process tools",
  description:
    `${COMPANY.legalName} builds landing pages, websites, and process tools with clear structure, fast execution, and measurable conversion focus.`,
  openGraphDescription:
    "From idea to production-ready website fast: clear offers, predictable delivery rhythm, and focused execution.",
  serviceDescription:
    "Landing pages, website upgrades, and process tools focused on performance, clarity, and conversion.",
};
