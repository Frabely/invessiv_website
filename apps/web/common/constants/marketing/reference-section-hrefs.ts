import {
  REFERENCE_IMAGE_KEY,
  REFERENCE_SECTION_IDS,
  type ReferenceImageKey,
} from "@/common/constants";

export const REFERENCE_SECTION_HREFS = {
  [REFERENCE_IMAGE_KEY.Allmacher]: `#${REFERENCE_SECTION_IDS.allmacher}`,
  [REFERENCE_IMAGE_KEY.Kolja]: `#${REFERENCE_SECTION_IDS.kolja}`,
  [REFERENCE_IMAGE_KEY.Consumption]: `#${REFERENCE_SECTION_IDS.consumption}`,
} as const satisfies Record<ReferenceImageKey, `#${string}`>;
