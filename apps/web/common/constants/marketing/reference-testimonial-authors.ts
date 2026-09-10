import type { ReferenceAvatarKey, ReferenceImageKey } from "@/common/constants";
import { REFERENCE_AVATAR_KEY } from "@/common/constants";

type ReferenceTestimonialAuthor = {
  avatarKey?: ReferenceAvatarKey;
  name: string;
};

export const REFERENCE_TESTIMONIAL_AUTHORS = {
  allmacher: {
    avatarKey: REFERENCE_AVATAR_KEY.Allmacher,
    name: "Dr. Christoph Allmacher",
  },
  kolja: {
    avatarKey: REFERENCE_AVATAR_KEY.Kolja,
    name: "Kolja Wienigk",
  },
} as const satisfies Partial<
  Record<ReferenceImageKey, ReferenceTestimonialAuthor>
>;

export type ReferenceTestimonialKey =
  keyof typeof REFERENCE_TESTIMONIAL_AUTHORS;
