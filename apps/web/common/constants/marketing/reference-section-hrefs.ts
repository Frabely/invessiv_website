import type { ReferenceImageKey } from "@/common/constants";

export const REFERENCE_SECTION_HREFS = {
  allmacher: "#allmacher",
  kolja: "#kolja",
  consumption: "#consumption",
} as const satisfies Record<ReferenceImageKey, `#${string}`>;
