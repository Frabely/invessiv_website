import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { DeliveryTokenInvalidReason } from "@/common/constants/generator/linkedin-post-delivery-token";
import type { LinkedInPostGeneratorPostDto } from "@/common/contracts";

export type DeliveryTokenPayload = {
  post: LinkedInPostGeneratorPostDto;
  caption: string;
  downloadFileName: string;
  locale: Locale;
  exp: number;
};

export type DeliveryTokenVerifyResult =
  | { valid: true; payload: DeliveryTokenPayload }
  | { valid: false; reason: DeliveryTokenInvalidReason };

export type DeliveryTokenInput = {
  post: LinkedInPostGeneratorPostDto;
  caption: string;
  downloadFileName: string;
  locale: Locale;
};
