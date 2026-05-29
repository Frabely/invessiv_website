import type { Locale } from "@/config/i18n";
import type { LinkedInPostTone } from "@invessiv/common/contracts/generator/linkedin-post-generator-tone";
import de from "./de.json";
import en from "./en.json";

export type LinkedInPostGeneratorFieldCopy = {
  label: string;
  placeholder?: string;
  help?: string;
  maxLength?: number;
  requiredError: string;
  tooLongError?: string;
  invalidError?: string;
};

export type LinkedInPostGeneratorToneOption = {
  value: LinkedInPostTone;
  label: string;
  description: string;
};

export type LinkedInPostGeneratorToneCopy = {
  label: string;
  help: string;
  options: LinkedInPostGeneratorToneOption[];
  requiredError: string;
};

export type LinkedInPostGeneratorConsentCopy = {
  label: string;
  requiredError: string;
};

export type LinkedInPostGeneratorFormCopy = {
  topic: LinkedInPostGeneratorFieldCopy;
  expertise: LinkedInPostGeneratorFieldCopy;
  tone: LinkedInPostGeneratorToneCopy;
  email: LinkedInPostGeneratorFieldCopy;
  consent: LinkedInPostGeneratorConsentCopy;
  honeypot: { label: string };
  submit: string;
  submitLoading: string;
  loadingHelp: string;
};

export type LinkedInPostGeneratorPreviewIdleCopy = {
  headline: string;
  body: string;
  stepLabel: string;
};

export type LinkedInPostGeneratorPreviewLoadingCopy = {
  headline: string;
  body: string;
  steps: string[];
};

export type LinkedInPostGeneratorPreviewSuccessCopy = {
  headline: string;
  imageAlt: string;
  captionLabel: string;
  copyCaption: string;
  copyCaptionCopied: string;
  downloadImage: string;
  downloadCaption: string;
};

export type LinkedInPostGeneratorCustomPostPostCopy = {
  authorName: string;
  authorRole: string;
  authorImageAlt: string;
  caption: string;
  captionMore: string;
  captionLess: string;
  imageSrc: string;
  imageAlt: string;
  commandLabel: string;
  command: string;
};

export type LinkedInPostGeneratorCustomPostCopy = {
  badge: string;
  headline: string;
  context: string;
  prompt: string;
  ctaLabel: string;
  ctaAriaLabel: string;
  ctaHref: string;
  post: LinkedInPostGeneratorCustomPostPostCopy;
};

export type LinkedInPostGeneratorPreviewErrorCopy = {
  headline: string;
  body: string;
};

export type LinkedInPostGeneratorPreviewCopy = {
  idle: LinkedInPostGeneratorPreviewIdleCopy;
  loading: LinkedInPostGeneratorPreviewLoadingCopy;
  success: LinkedInPostGeneratorPreviewSuccessCopy;
  error: LinkedInPostGeneratorPreviewErrorCopy;
};

export type LinkedInPostGeneratorContent = {
  eyebrow: string;
  title: string;
  body: string;
  form: LinkedInPostGeneratorFormCopy;
  preview: LinkedInPostGeneratorPreviewCopy;
  customPost: LinkedInPostGeneratorCustomPostCopy;
};

const CONTENT: Record<Locale, LinkedInPostGeneratorContent> = {
  de: de as LinkedInPostGeneratorContent,
  en: en as LinkedInPostGeneratorContent,
};

export function getLinkedInPostGeneratorContent(
  locale: Locale,
): LinkedInPostGeneratorContent {
  return CONTENT[locale];
}
