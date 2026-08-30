import type { ReferenceImageKey } from "@/common/constants/marketing/reference-image-key";
import type { Locale } from "@/config/i18n";
import type { ReferenceLabels } from "@/common/contracts/marketing/reference-labels";
import type { ReferenceTestimonialContent } from "@/common/contracts/marketing/reference-testimonial";
import de from "./references.de.json";
import en from "./references.en.json";

export type ReferencesBreadcrumbsContent = {
  currentLabel: string;
  homeLabel: string;
  navLabel: string;
};

export type ReferencesHeroContent = {
  intro: string;
  kicker: string;
  highlights: string[];
  supportingNote: string;
  title: string;
};

export type ReferencesSectionIntroContent = {
  eyebrow: string;
  title: string;
  description: string;
};

export type ReferencesCaseStudyContent = {
  category: string;
  deliverables: string[];
  deliverablesLabel: string;
  focus: string;
  focusLabel: string;
  href: string;
  imageAlt: string;
  imageKey: ReferenceImageKey;
  kicker: string;
  linkLabel: string;
  outcomes: string[];
  outcomesLabel: string;
  summary: string;
  testimonial?: ReferenceTestimonialContent;
  title: string;
};

export type ReferencesClosingCtaContent = {
  primaryLabel: string;
  secondaryLabel: string;
  supportingText: string;
  title: string;
};

export type ReferencesPageContent = {
  breadcrumbs: ReferencesBreadcrumbsContent;
  closingCta: ReferencesClosingCtaContent;
  hero: ReferencesHeroContent;
  projects: ReferencesCaseStudyContent[];
  sectionIntro: ReferencesSectionIntroContent;
  testimonialLabels: Pick<ReferenceLabels, "collapseQuote" | "expandQuote">;
};

const REFERENCES_PAGE_CONTENT: Record<Locale, ReferencesPageContent> = {
  de: de as ReferencesPageContent,
  en: en as ReferencesPageContent,
};

export function getReferencesPageContent(
  locale: Locale,
): ReferencesPageContent {
  return REFERENCES_PAGE_CONTENT[locale];
}
