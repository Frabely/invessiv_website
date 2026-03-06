import { COMPANY } from "@/config/company";

export type MarketingRootMetaContent = {
  description: string;
  openGraphDescription: string;
  pageTitle: string;
  serviceDescription: string;
};

export const MARKETING_ROOT_META_CONTENT: MarketingRootMetaContent = {
  pageTitle: "Landing pages, websites, process tools, and AI templates & agents",
  description:
    `${COMPANY.legalName} builds landing pages, websites, process tools, and AI templates & agents with clear scope, predictable delivery, and conversion focus.`,
  openGraphDescription:
    "From idea to production-ready deliverables with clear scope, transparent timelines, and focused execution.",
  serviceDescription:
    "Landing pages, website upgrades, process tools, and AI templates & agents focused on performance, clarity, and conversion.",
};
