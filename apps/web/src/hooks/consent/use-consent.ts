"use client";

import { useContext } from "react";
import {
  ConsentContext,
  type ConsentContextValue,
} from "@/components/providers/consent-provider/consent-context";
import { CONSENT_PROVIDER_MISSING_ERROR } from "@invessiv/common/constants/providers/provider-errors";

export function useConsent(): ConsentContextValue {
  const value = useContext(ConsentContext);
  if (!value) {
    throw new Error(CONSENT_PROVIDER_MISSING_ERROR);
  }
  return value;
}
