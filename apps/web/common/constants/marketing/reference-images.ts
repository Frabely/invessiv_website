import allmacherAvatarImage from "@/assets/home/references/christoph-allmacher.jpg";
import koljaAvatarImage from "@/assets/home/references/kolja-wienigk.jpg";
import allmacherImage from "@/assets/reference-allmacher.png";
import koljaImage from "@/assets/reference-kolja-wienigk.png";
import consumptionImage from "@/assets/review-project-consumption.png";
import type { ReferenceAvatarKey, ReferenceImageKey } from "@/common/constants";

export const REFERENCE_IMAGES = {
  allmacher: allmacherImage,
  kolja: koljaImage,
  consumption: consumptionImage,
} as const satisfies Record<ReferenceImageKey, unknown>;

export const REFERENCE_AVATAR_IMAGES = {
  allmacher: allmacherAvatarImage,
  kolja: koljaAvatarImage,
} as const satisfies Record<ReferenceAvatarKey, unknown>;
