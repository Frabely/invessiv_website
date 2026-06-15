import { COMPANY } from "@/config/company";

export const SITE_BRAND_NAME = COMPANY.brandName;
export const SITE_NAME = SITE_BRAND_NAME;
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.invessiv.com";
export const SITE_LOGO_URL = `${SITE_URL}/brand/icon.png`;
export const DEFAULT_LOCALE = "de";
