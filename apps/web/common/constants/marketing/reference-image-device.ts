import {
  REFERENCE_IMAGE_KEY,
  type ReferenceImageKey,
} from "@/common/constants";
import { REFERENCE_DEVICE, type ReferenceDevice } from "./reference-device";

export const REFERENCE_IMAGE_DEVICE = {
  [REFERENCE_IMAGE_KEY.Allmacher]: REFERENCE_DEVICE.Browser,
  [REFERENCE_IMAGE_KEY.Kolja]: REFERENCE_DEVICE.Browser,
  [REFERENCE_IMAGE_KEY.Consumption]: REFERENCE_DEVICE.Phone,
} as const satisfies Record<ReferenceImageKey, ReferenceDevice>;
