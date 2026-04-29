"use client";

import { useCallback, useRef } from "react";

import {
  trackConversionEvent,
  type ConversionEventPayload,
} from "@/lib/analytics/conversion-events";
import type { ContactFormSubmitErrorType } from "@/lib/analytics/contact-form-submit-error-type";

type ContactFormAnalyticsOptions = {
  formId: string;
  location: string;
  target?: string;
  variant?: string;
};

export function useContactFormAnalytics({
  formId,
  location,
  target = "form",
  variant = "primary",
}: ContactFormAnalyticsOptions) {
  const hasStartedRef = useRef(false);

  const getBasePayload = useCallback(
    (payload?: ConversionEventPayload): ConversionEventPayload => ({
      form_id: formId,
      location,
      target,
      variant,
      ...payload,
    }),
    [formId, location, target, variant],
  );

  const trackFormStart = useCallback(
    (payload?: ConversionEventPayload) => {
      if (hasStartedRef.current) {
        return;
      }
      hasStartedRef.current = true;
      trackConversionEvent("form_start", getBasePayload(payload));
    },
    [getBasePayload],
  );

  const trackSubmitAttempt = useCallback(
    (payload?: ConversionEventPayload) => {
      trackFormStart(payload);
      trackConversionEvent("form_submit_attempt", getBasePayload(payload));
    },
    [getBasePayload, trackFormStart],
  );

  const trackSubmitSuccess = useCallback(
    (payload?: ConversionEventPayload) => {
      trackConversionEvent("lead_submit_success", getBasePayload(payload));
    },
    [getBasePayload],
  );

  const trackSubmitError = useCallback(
    (
      errorType: ContactFormSubmitErrorType,
      payload?: ConversionEventPayload,
    ) => {
      trackConversionEvent("form_submit_error", {
        ...getBasePayload(payload),
        error_type: errorType,
      });
    },
    [getBasePayload],
  );

  const resetFormAnalytics = useCallback(() => {
    hasStartedRef.current = false;
  }, []);

  return {
    resetFormAnalytics,
    trackFormStart,
    trackSubmitAttempt,
    trackSubmitError,
    trackSubmitSuccess,
  };
}
