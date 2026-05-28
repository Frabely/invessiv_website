import type { NavigationItem } from "@/config/navigation/home";

export const AI_WORKFLOWS_SECTION_IDS = [
  "problem",
  "offer",
  "pricing",
  "privacy",
  "contact",
  "footer",
] as const;

export type AiWorkflowsSectionId = (typeof AI_WORKFLOWS_SECTION_IDS)[number];
export type AiWorkflowsSectionHref = `#${AiWorkflowsSectionId}`;

export const AI_WORKFLOWS_SECTION_HREFS = {
  problem: "#problem",
  offer: "#offer",
  pricing: "#pricing",
  privacy: "#privacy",
  contact: "#contact",
  footer: "#footer",
} as const satisfies Record<AiWorkflowsSectionId, AiWorkflowsSectionHref>;

export const AI_WORKFLOWS_HEADER_NAVIGATION: NavigationItem[] = [
  { href: AI_WORKFLOWS_SECTION_HREFS.offer },
  { href: AI_WORKFLOWS_SECTION_HREFS.pricing },
  { href: AI_WORKFLOWS_SECTION_HREFS.contact },
];
