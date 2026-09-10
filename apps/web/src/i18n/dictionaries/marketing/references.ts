import type { ReferenceImageKey } from "@/common/constants/marketing/reference-image-key";
import type { Locale } from "@/config/i18n";
import type { ReferenceLabels } from "@/common/contracts/marketing/reference-labels";
import type { ReferenceTestimonialContent } from "@/common/contracts/marketing/reference-testimonial";
import { findReferenceTestimonial } from "./reference-testimonials";
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

type ReferencesPageDictionary = Omit<ReferencesPageContent, "projects"> & {
  projects: Array<Omit<ReferencesCaseStudyContent, "testimonial">>;
};

const REFERENCES_PAGE_CONTENT: Record<Locale, ReferencesPageDictionary> = {
  de: de as ReferencesPageDictionary,
  en: en as ReferencesPageDictionary,
};

export function getReferencesPageContent(
  locale: Locale,
): ReferencesPageContent {
  const content = REFERENCES_PAGE_CONTENT[locale];

  return {
    ...content,
    projects: content.projects.map((project) => ({
      ...project,
      testimonial: findReferenceTestimonial(project.imageKey, locale),
    })),
  };
}
