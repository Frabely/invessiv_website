import type { ReferenceAvatarKey } from "@/common/constants/marketing/reference-avatar-key";

export type ReferenceTestimonialContent = {
  authorName: string;
  avatarAlt?: string;
  avatarKey?: ReferenceAvatarKey;
  quote: string;
  role: string;
};
