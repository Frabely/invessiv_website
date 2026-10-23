import type { Locale } from "@/config/i18n";
import type { ReferenceCaseStudyContent } from "@/common/contracts/marketing/reference-case-study";
import type { ReferenceCaseStudyLabels } from "@/common/contracts/marketing/reference-case-study-labels";
import { findReferenceTestimonial } from "./reference-testimonials";
import de from "./references.de.json";
import en from "./references.en.json";

export type ReferencesBreadcrumbsContent = {
  currentLabel: string;
  homeLabel: string;
  navLabel: string;
};

export type ReferencesHeroContent = {
  indexLabel: string;
  intro: string;
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
  labels: ReferenceCaseStudyLabels;
  projects: ReferenceCaseStudyContent[];
};

type ReferencesPageDictionary = Omit<ReferencesPageContent, "projects"> & {
  projects: Array<Omit<ReferenceCaseStudyContent, "testimonial">>;
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
