import type { ReferenceImageKey } from "@/common/constants/marketing/reference-image-key";
import {
  REFERENCE_TESTIMONIAL_AUTHORS,
  type ReferenceTestimonialKey,
} from "@/common/constants/marketing/reference-testimonial-authors";
import type { ReferenceTestimonialContent } from "@/common/contracts/marketing/reference-testimonial";
import type { Locale } from "@/config/i18n";
import de from "./reference-testimonials.de.json";
import en from "./reference-testimonials.en.json";

type ReferenceTestimonialCopy = {
  quote: string;
  role: string;
};

type ReferenceTestimonialsDictionary = {
  entries: Record<ReferenceTestimonialKey, ReferenceTestimonialCopy>;
  portraitAltTemplate: string;
};

const REFERENCE_TESTIMONIALS: Record<Locale, ReferenceTestimonialsDictionary> =
  { de, en };

function isReferenceTestimonialKey(
  imageKey: ReferenceImageKey,
): imageKey is ReferenceTestimonialKey {
  return imageKey in REFERENCE_TESTIMONIAL_AUTHORS;
}

export function getReferenceTestimonial(
  key: ReferenceTestimonialKey,
  locale: Locale,
): ReferenceTestimonialContent {
  const { entries, portraitAltTemplate } = REFERENCE_TESTIMONIALS[locale];
  const author = REFERENCE_TESTIMONIAL_AUTHORS[key];

  return {
    ...entries[key],
    authorName: author.name,
    avatarAlt: portraitAltTemplate.replace("{name}", author.name),
    avatarKey: author.avatarKey,
  };
}

export function findReferenceTestimonial(
  imageKey: ReferenceImageKey,
  locale: Locale,
): ReferenceTestimonialContent | undefined {
  return isReferenceTestimonialKey(imageKey)
    ? getReferenceTestimonial(imageKey, locale)
    : undefined;
}
