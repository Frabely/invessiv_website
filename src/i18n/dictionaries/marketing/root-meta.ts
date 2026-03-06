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
    `${COMPANY.legalName} builds landing pages, websites, process tools, and AI templates & agents in an AI agent workflow with clear scope, predictable delivery, and conversion focus.`,
  openGraphDescription:
    "From requirements to agent setup, AI-assisted build, and production-ready delivery with clear scope and focused execution.",
  serviceDescription:
    "Landing pages, website upgrades, process tools, and AI templates & agents with an AI-agent-supported delivery workflow focused on performance, clarity, and conversion.",
};
