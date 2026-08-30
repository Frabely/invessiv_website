import {
  REFERENCE_IMAGE_KEY,
  type ReferenceImageKey,
} from "@/common/constants";

export const REFERENCE_SECTION_IDS = {
  [REFERENCE_IMAGE_KEY.Allmacher]: "allmacher",
  [REFERENCE_IMAGE_KEY.Kolja]: "kolja",
  [REFERENCE_IMAGE_KEY.Consumption]: "consumption",
} as const satisfies Record<ReferenceImageKey, string>;
