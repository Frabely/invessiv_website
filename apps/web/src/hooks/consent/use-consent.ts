"use client";

import { useContext } from "react";
import { type ConsentContextValue } from "@/common/contracts/consent/consent-context-value";
import { ConsentContext } from "@/components/providers/consent-provider/consent-context";
import { CONSENT_PROVIDER_MISSING_ERROR } from "@invessiv/common/constants/providers/provider-errors";

export function useConsent(): ConsentContextValue {
  const value = useContext(ConsentContext);
  if (!value) {
    throw new Error(CONSENT_PROVIDER_MISSING_ERROR);
  }
  return value;
}
