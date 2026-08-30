import type { ReferenceImageKey } from "@/common/constants/marketing/reference-image-key";
import type { ReferenceTestimonialContent } from "@/common/contracts/marketing/reference-testimonial";

export type ReferenceEntry = ReferenceTestimonialContent & {
  imageAlt: string;
  imageKey: ReferenceImageKey;
  linkLabel: string;
  selectorLabel: string;
  siteLabel: string;
};
