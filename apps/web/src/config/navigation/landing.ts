import {
  CONTACT_SECTION_ID,
  FAQ_SECTION_ID,
  HERO_SECTION_ID,
  PROCESS_SECTION_ID,
} from "@/config/navigation/home";
import type { NavigationItem } from "@/common/contracts/marketing/navigation-item";

export const LANDING_SECTION_IDS = {
  hero: HERO_SECTION_ID,
  solution: "solution",
  trust: "trust",
  audience: "audience",
  process: PROCESS_SECTION_ID,
  pricing: "pricing",
  faq: FAQ_SECTION_ID,
  contact: CONTACT_SECTION_ID,
} as const;

export const LANDING_FUNNEL_SECTION_IDS = [
  LANDING_SECTION_IDS.hero,
  LANDING_SECTION_IDS.solution,
  LANDING_SECTION_IDS.trust,
  LANDING_SECTION_IDS.audience,
  LANDING_SECTION_IDS.process,
  LANDING_SECTION_IDS.pricing,
  LANDING_SECTION_IDS.faq,
  LANDING_SECTION_IDS.contact,
] as const;

export const LANDING_HERO_FUNNEL_SECTION_IDS = [
  LANDING_SECTION_IDS.hero,
] as const;

export const LANDING_GATED_FUNNEL_SECTION_IDS = [
  LANDING_SECTION_IDS.solution,
  LANDING_SECTION_IDS.trust,
  LANDING_SECTION_IDS.audience,
  LANDING_SECTION_IDS.process,
  LANDING_SECTION_IDS.pricing,
  LANDING_SECTION_IDS.faq,
  LANDING_SECTION_IDS.contact,
] as const;

export type LandingFunnelSectionId =
  (typeof LANDING_FUNNEL_SECTION_IDS)[number];

const toNavigationItem = (sectionId: string): NavigationItem => ({
  href: `#${sectionId}`,
});

export const LANDING_HEADER_NAVIGATION: NavigationItem[] = [
  LANDING_SECTION_IDS.solution,
  LANDING_SECTION_IDS.trust,
  LANDING_SECTION_IDS.process,
  LANDING_SECTION_IDS.pricing,
  LANDING_SECTION_IDS.faq,
].map(toNavigationItem);
