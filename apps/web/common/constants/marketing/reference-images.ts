import allmacherAvatarImage from "../../../assets/home/references/christoph-allmacher.jpg";
import koljaAvatarImage from "../../../assets/home/references/kolja-wienigk.jpg";
import allmacherImage from "../../../assets/reference-allmacher.png";
import koljaImage from "../../../assets/reference-kolja-wienigk.png";
import consumptionImage from "../../../assets/review-project-consumption.png";
import {
  REFERENCE_AVATAR_KEY,
  REFERENCE_IMAGE_KEY,
  type ReferenceAvatarKey,
  type ReferenceImageKey,
} from "@/common/constants";

export const REFERENCE_IMAGES = {
  [REFERENCE_IMAGE_KEY.Allmacher]: allmacherImage,
  [REFERENCE_IMAGE_KEY.Kolja]: koljaImage,
  [REFERENCE_IMAGE_KEY.Consumption]: consumptionImage,
} as const satisfies Record<ReferenceImageKey, unknown>;

export const REFERENCE_AVATAR_IMAGES = {
  [REFERENCE_AVATAR_KEY.Allmacher]: allmacherAvatarImage,
  [REFERENCE_AVATAR_KEY.Kolja]: koljaAvatarImage,
} as const satisfies Record<ReferenceAvatarKey, unknown>;
