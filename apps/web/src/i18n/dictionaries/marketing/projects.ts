import type { Locale } from "@/config/i18n";
import de from "./projects.de.json";
import en from "./projects.en.json";

export type ProjectsBreadcrumbsContent = {
  currentLabel: string;
  homeLabel: string;
  navLabel: string;
};

export type ProjectsHeroContent = {
  intro: string;
  kicker: string;
  highlights: string[];
  supportingNote: string;
  title: string;
};

export type ProjectsSectionIntroContent = {
  eyebrow: string;
  title: string;
  description: string;
};

export type ProjectsCaseStudyContent = {
  category: string;
  deliverables: string[];
  deliverablesLabel: string;
  focus: string;
  focusLabel: string;
  href: string;
  imageAlt: string;
  imageKey: "broker" | "consumption";
  kicker: string;
  linkLabel: string;
  outcomes: string[];
  outcomesLabel: string;
  summary: string;
  title: string;
};

export type ProjectsClosingCtaContent = {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  supportingText: string;
  title: string;
};

export type ProjectsPageContent = {
  breadcrumbs: ProjectsBreadcrumbsContent;
  closingCta: ProjectsClosingCtaContent;
  hero: ProjectsHeroContent;
  projects: ProjectsCaseStudyContent[];
  sectionIntro: ProjectsSectionIntroContent;
};

const PROJECTS_PAGE_CONTENT: Record<Locale, ProjectsPageContent> = {
  de: de as ProjectsPageContent,
  en: en as ProjectsPageContent,
};

export function getProjectsPageContent(locale: Locale): ProjectsPageContent {
  return PROJECTS_PAGE_CONTENT[locale];
}
