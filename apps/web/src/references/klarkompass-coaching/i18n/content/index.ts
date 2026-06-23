import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type KlarkompassHeaderContent = {
  brand: string;
  navLabels: string[];
  ctaLabel: string;
  mockLabel: string;
  menuOpenLabel: string;
  menuCloseLabel: string;
};

export type KlarkompassHeroBearing = {
  readout: string;
  caption: string;
};

export type KlarkompassHeroContent = {
  badge: string;
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  trustLine: string;
  imageAlt: string;
  bearing: KlarkompassHeroBearing;
};

export type KlarkompassProblemCompass = {
  cardinals: string[];
  axes: string[];
};

export type KlarkompassProblemContent = {
  eyebrow: string;
  title: string;
  intro: string;
  points: string[];
  compass: KlarkompassProblemCompass;
};

export type KlarkompassTitledItem = {
  title: string;
  description: string;
};

export type KlarkompassResultsContent = {
  eyebrow: string;
  title: string;
  lead: string;
  startLabel: string;
  destinationTag: string;
  items: KlarkompassTitledItem[];
};

export type KlarkompassStep = {
  number: string;
  title: string;
  description: string;
};

export type KlarkompassMethodContent = {
  eyebrow: string;
  title: string;
  intro: string;
  steps: KlarkompassStep[];
};

export type KlarkompassOfferContent = {
  eyebrow: string;
  title: string;
  description: string;
  includesLabel: string;
  includes: string[];
  suitableLabel: string;
  suitable: string[];
  ctaLabel: string;
  noPriceNote: string;
};

export type KlarkompassAboutContent = {
  eyebrow: string;
  title: string;
  name: string;
  role: string;
  bio: string;
  portraitAlt: string;
  valuesLabel: string;
  values: KlarkompassTitledItem[];
};

export type KlarkompassProcessContent = {
  eyebrow: string;
  title: string;
  steps: KlarkompassStep[];
};

export type KlarkompassTrustContent = {
  eyebrow: string;
  title: string;
  points: string[];
  honestNote: string;
};

export type KlarkompassFaqItem = {
  question: string;
  answer: string;
};

export type KlarkompassFaqContent = {
  eyebrow: string;
  title: string;
  items: KlarkompassFaqItem[];
};

export type KlarkompassFinalCtaContent = {
  title: string;
  description: string;
  ctaLabel: string;
  mockNote: string;
};

export type KlarkompassFooterContent = {
  brand: string;
  tagline: string;
  navLabels: string[];
  conceptNote: string;
  backLinkLabel: string;
};

export type KlarkompassContent = {
  header: KlarkompassHeaderContent;
  hero: KlarkompassHeroContent;
  problem: KlarkompassProblemContent;
  results: KlarkompassResultsContent;
  method: KlarkompassMethodContent;
  offer: KlarkompassOfferContent;
  about: KlarkompassAboutContent;
  process: KlarkompassProcessContent;
  trust: KlarkompassTrustContent;
  faq: KlarkompassFaqContent;
  finalCta: KlarkompassFinalCtaContent;
  footer: KlarkompassFooterContent;
};

const KLARKOMPASS_CONTENT: Record<Locale, KlarkompassContent> = {
  de: de as KlarkompassContent,
  en: en as KlarkompassContent,
};

export function getKlarkompassContent(locale: Locale): KlarkompassContent {
  return KLARKOMPASS_CONTENT[locale];
}
