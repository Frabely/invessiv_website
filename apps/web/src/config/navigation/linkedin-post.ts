import type { NavigationItem } from "@/config/navigation/home";

export const LINKEDIN_POST_SECTION_IDS = [
  "problem",
  "example",
  "generator",
  "privacy",
  "footer",
] as const;

export type LinkedInPostSectionId = (typeof LINKEDIN_POST_SECTION_IDS)[number];
export type LinkedInPostSectionHref = `#${LinkedInPostSectionId}`;

export const LINKEDIN_POST_SECTION_HREFS = {
  problem: "#problem",
  example: "#example",
  generator: "#generator",
  privacy: "#privacy",
  footer: "#footer",
} as const satisfies Record<LinkedInPostSectionId, LinkedInPostSectionHref>;

export const LINKEDIN_POST_HEADER_NAVIGATION: NavigationItem[] = [
  { href: LINKEDIN_POST_SECTION_HREFS.example },
  { href: LINKEDIN_POST_SECTION_HREFS.generator },
];
