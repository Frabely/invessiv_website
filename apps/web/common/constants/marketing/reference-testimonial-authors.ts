import type { ReferenceAvatarKey, ReferenceImageKey } from "@/common/constants";

type ReferenceTestimonialAuthor = {
  avatarKey?: ReferenceAvatarKey;
  name: string;
};

export const REFERENCE_TESTIMONIAL_AUTHORS = {
  allmacher: {
    avatarKey: "allmacher",
    name: "Dr. Christoph Allmacher",
  },
  kolja: {
    avatarKey: "kolja",
    name: "Kolja Wienigk",
  },
} as const satisfies Partial<
  Record<ReferenceImageKey, ReferenceTestimonialAuthor>
>;

export type ReferenceTestimonialKey =
  keyof typeof REFERENCE_TESTIMONIAL_AUTHORS;
