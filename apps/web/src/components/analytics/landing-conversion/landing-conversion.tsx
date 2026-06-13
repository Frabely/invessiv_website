"use client";

import { useLandingConversion } from "@/hooks/analytics/use-landing-conversion";

export function LandingConversion(): null {
  useLandingConversion();
  return null;
}
