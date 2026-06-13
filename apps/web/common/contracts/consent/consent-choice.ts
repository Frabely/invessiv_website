import type { ConsentCategory } from "@/common/constants/consent/consent-category";

export type ConsentChoice = Record<ConsentCategory, boolean>;
