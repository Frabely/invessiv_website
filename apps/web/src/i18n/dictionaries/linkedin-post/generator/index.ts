import type { Locale } from "@/config/i18n";
import type { LinkedInPostTone } from "@/common/contracts/generator/post/linkedin-post-generator-tone";
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

export type LinkedInPostGeneratorColorCopy = {
  label: string;
  help: string;
  autoLabel: string;
  swatchLabel: string;
};

export type LinkedInPostGeneratorFormCopy = {
  topic: LinkedInPostGeneratorFieldCopy;
  expertise: LinkedInPostGeneratorFieldCopy;
  tone: LinkedInPostGeneratorToneCopy;
  color: LinkedInPostGeneratorColorCopy;
  honeypot: { label: string };
  privacyNotice: string;
  submit: string;
  submitLoading: string;
  loadingHelp: string;
};

export type LinkedInPostGeneratorUsageMeterCopy = {
  regionLabel: string;
  idle: string;
  remaining: string;
  resetPrefix: string;
};

export type LinkedInPostGeneratorResultDownloadCopy = {
  headline: string;
  body: string;
  downloadAction: string;
  downloadUnavailable: string;
  fileBaseName: string;
  newPostAction: string;
};

export type LinkedInPostGeneratorPreviewLoadingCopy = {
  headline: string;
  body: string;
  steps: string[];
};

export type LinkedInPostGeneratorPreviewSuccessCopy = {
  copyCaption: string;
  copyCaptionCopied: string;
  captionMore: string;
  captionLess: string;
  fallbackAuthorName: string;
  followUp: {
    badge: string;
    headline: string;
    body: string;
    ctaLabel: string;
    ctaAriaLabel: string;
  };
};

export type LinkedInPostGeneratorCustomPostPostCopy = {
  authorName: string;
  authorRole: string;
  authorImageAlt: string;
  caption: string;
  linkUrl: string;
  captionMore: string;
  captionLess: string;
  maximizeLabel: string;
  lightboxCloseLabel: string;
  lightboxAriaLabel: string;
  imageSrc: string;
  imageAlt: string;
  commandLabel: string;
  command: string;
};

export type LinkedInPostGeneratorCustomPostCopy = {
  badge: string;
  headline: string;
  context: string;
  post: LinkedInPostGeneratorCustomPostPostCopy;
};

export type LinkedInPostGeneratorPreviewErrorCopy = {
  headline: string;
  body: string;
};

export type LinkedInPostGeneratorPreviewLimitReachedCopy = {
  badge: string;
  headline: string;
  body: string;
  resetPrefix: string;
  ctaLabel: string;
  ctaAriaLabel: string;
};

export type LinkedInPostGeneratorPreviewCopy = {
  loading: LinkedInPostGeneratorPreviewLoadingCopy;
  success: LinkedInPostGeneratorPreviewSuccessCopy;
  limitReached: LinkedInPostGeneratorPreviewLimitReachedCopy;
  error: LinkedInPostGeneratorPreviewErrorCopy;
};

export type LinkedInPostGeneratorContent = {
  eyebrow: string;
  title: string;
  body: string;
  form: LinkedInPostGeneratorFormCopy;
  usageMeter: LinkedInPostGeneratorUsageMeterCopy;
  resultDownload: LinkedInPostGeneratorResultDownloadCopy;
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
