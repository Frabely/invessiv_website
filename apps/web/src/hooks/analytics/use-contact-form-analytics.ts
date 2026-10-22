"use client";

import { useCallback, useRef } from "react";

import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import {
  AnalyticsCalendarSource,
  AnalyticsFormId,
  type AnalyticsFormFailureReason,
  type AnalyticsFormPlacement,
} from "@/common/constants/analytics/analytics-form";
import { trackAnalyticsEvent } from "@/lib/analytics/track-analytics-event";

type ContactFormAnalyticsOptions = {
  form: AnalyticsFormId;
  placement: AnalyticsFormPlacement;
};

export function useContactFormStartTracking(placement: AnalyticsFormPlacement) {
  const hasStartedRef = useRef(false);

  const trackStarted = useCallback(() => {
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;
    trackAnalyticsEvent(AnalyticsEventName.FormStarted, {
      form: AnalyticsFormId.Contact,
      placement,
    });
  }, [placement]);

  const resetStarted = useCallback(() => {
    hasStartedRef.current = false;
  }, []);

  return { resetStarted, trackStarted };
}

export function useContactFormAnalytics({
  form,
  placement,
}: ContactFormAnalyticsOptions) {
  const trackSubmitted = useCallback(() => {
    trackAnalyticsEvent(AnalyticsEventName.FormSubmitted, { form, placement });
  }, [form, placement]);

  const trackInvalid = useCallback(
    (invalidFieldNames: readonly string[]) => {
      const [firstInvalidField] = invalidFieldNames;
      if (!firstInvalidField) {
        return;
      }
      trackAnalyticsEvent(AnalyticsEventName.FormInvalid, {
        form,
        field: firstInvalidField,
      });
    },
    [form],
  );

  const trackFailed = useCallback(
    (reason: AnalyticsFormFailureReason) => {
      trackAnalyticsEvent(AnalyticsEventName.FormFailed, { form, reason });
    },
    [form],
  );

  const trackCompleted = useCallback(() => {
    trackAnalyticsEvent(AnalyticsEventName.FormCompleted, { form, placement });
  }, [form, placement]);

  const trackCalendarOpened = useCallback(() => {
    trackAnalyticsEvent(AnalyticsEventName.CalendarOpened, {
      source: AnalyticsCalendarSource.AfterSubmit,
      placement,
    });
  }, [placement]);

  return {
    trackCalendarOpened,
    trackCompleted,
    trackFailed,
    trackInvalid,
    trackSubmitted,
  };
}
