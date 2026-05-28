import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type OfferDeliverable = {
  label: string;
  detail: string;
};

export type OfferStep = {
  label: string;
};

export type LandingAiOfferContent = {
  eyebrow: string;
  title: string;
  body: string;
  deliverablesHeading: string;
  deliverables: OfferDeliverable[];
  proofNote: string;
  stepsLabel: string;
  steps: OfferStep[];
};

const CONTENT: Record<Locale, LandingAiOfferContent> = { de, en };

export function getAiWorkflowsOfferContent(
  locale: Locale,
): LandingAiOfferContent {
  return CONTENT[locale];
}
