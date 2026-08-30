import type { ReferenceDevice } from "./reference-device";
import type { ReferenceImageKey } from "@/common/constants";

export const REFERENCE_IMAGE_DEVICE = {
  allmacher: "browser",
  kolja: "browser",
  consumption: "phone",
} as const satisfies Record<ReferenceImageKey, ReferenceDevice>;
