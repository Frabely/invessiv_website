import type { ReferenceAvatarKey } from "@/common/constants/marketing/reference-avatar-key";

export type ReferenceTestimonialContent = {
  authorName: string;
  avatarAlt?: string;
  avatarKey?: ReferenceAvatarKey;
  // Set while a quote is parked: the copy stays, the block is not rendered.
  isQuoteHidden?: boolean;
  quote: string;
  role: string;
};
