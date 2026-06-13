"use client";

import { useCallback, useRef } from "react";

import { type ContactFormAnalyticsOptions } from "@/common/contracts/analytics/contact-form-analytics-options";
import { type ConversionEventPayload } from "@/common/contracts/analytics/conversion-event-payload";
import type { ContactFormSubmitErrorType } from "@/lib/analytics/contact-form-submit-error-type";
import { trackConversionEvent } from "@/lib/analytics/conversion-events";

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
