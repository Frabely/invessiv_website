import type { ReferenceImageKey } from "@/common/constants/marketing/reference-image-key";
import type { ReferenceShotContent } from "./reference-shot";
import type { ReferenceTestimonialContent } from "@/common/contracts";

export type ReferenceCaseStudyContent = {
  clientName: string;
  href: string;
  imageKey: ReferenceImageKey;
  industry: string;
  linkLabel: string;
  problem: string;
  result: string;
  scope: string[];
  shots: ReferenceShotContent[];
  solution: string;
  testimonial?: ReferenceTestimonialContent;
  title: string;
};
