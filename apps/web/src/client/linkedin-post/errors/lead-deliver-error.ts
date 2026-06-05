import { LinkedInPostGeneratorErrorCode } from "@/common/constants/generator/linkedin-post-generator-error-codes";
import type { LinkedInPostGeneratorLeadCaptureCopy } from "@/i18n/dictionaries/linkedin-post/generator";

export function leadDeliverErrorMessage(
  code: string,
  copy: LinkedInPostGeneratorLeadCaptureCopy["deliver"],
): string {
  switch (code) {
    case LinkedInPostGeneratorErrorCode.DeliveryRateLimited:
      return copy.errorRateLimited;
    case LinkedInPostGeneratorErrorCode.DeliveryTokenExpired:
    case LinkedInPostGeneratorErrorCode.DeliveryTokenInvalid:
      return copy.errorExpired;
    default:
      return copy.errorGeneric;
  }
}
