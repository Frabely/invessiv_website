import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type KlarkompassHeaderContent = {
  brand: string;
  navLabels: string[];
  ctaLabel: string;
  mockLabel: string;
  ctaAlertMessage: string;
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

export type KlarkompassResultShift = {
  title: string;
  from: string;
  to: string;
};

export type KlarkompassResultsContent = {
  eyebrow: string;
  title: string;
  lead: string;
  fromLabel: string;
  toLabel: string;
  items: KlarkompassResultShift[];
};

export type KlarkompassStep = {
  number: string;
  bearing: string;
  kicker: string;
  title: string;
  description: string;
  outcome: string;
};

export type KlarkompassOfferContent = {
  eyebrow: string;
  title: string;
  description: string;
  includesLabel: string;
  includes: string[];
  suitableLabel: string;
  suitable: string[];
  priceLabel: string;
  price: string;
  priceCaption: string;
  ctaLabel: string;
  priceNote: string;
};

export type KlarkompassAboutContent = {
  eyebrow: string;
  title: string;
  name: string;
  role: string;
  bio: string;
  portraitAlt: string;
  photoNote: string;
  valuesLabel: string;
  values: KlarkompassTitledItem[];
};

export type KlarkompassProcessContent = {
  eyebrow: string;
  title: string;
  lead: string;
  compassLabel: string;
  compassCaption: string;
  noteLabel: string;
  note: string;
  steps: KlarkompassStep[];
};

export type KlarkompassTrustContent = {
  eyebrow: string;
  title: string;
  lead: string;
  proofLabel: string;
  proofValue: string;
  imageAlt: string;
  photoNote: string;
  points: KlarkompassTitledItem[];
  honestNote: string;
};

export type KlarkompassFaqItem = {
  question: string;
  answer: string;
};

export type KlarkompassFaqContent = {
  eyebrow: string;
  title: string;
  lead: string;
  contactPrompt: string;
  items: KlarkompassFaqItem[];
};

export type KlarkompassFinalCtaContent = {
  bearing: {
    readout: string;
    caption: string;
  };
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
