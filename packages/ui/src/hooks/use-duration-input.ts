"use client";

import { useEffect, useRef } from "react";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";

/** Controlled duration with independent, bounded hour and minute steps. */
export function useDurationInput(
  value: string,
  onChangeAction: (value: string) => void,
  minuteStep: number,
  maxMinutes: number,
) {
  if (
    !Number.isInteger(minuteStep) ||
    minuteStep < 1 ||
    minuteStep > 60 ||
    60 % minuteStep !== 0
  ) {
    throw new RangeError("minuteStep must be a positive divisor of 60");
  }
  const [hourText, minuteText] = value.split(":");
  const hours = Number(hourText || 0);
  const minutes = Number(minuteText || 0);
  const total = hours * 60 + minutes;
  const liveTotal = useRef(total);
  useEffect(() => {
    liveTotal.current = total;
  }, [total]);

  function limits(current: number) {
    const hours = Math.floor(current / 60);
    const minutes = current % 60;
    return {
      hours,
      minutes,
      maxHours: Math.max(0, Math.floor((maxMinutes - minutes) / 60)),
      maxMinute: Math.max(
        0,
        Math.min(
          60 - minuteStep,
          Math.floor((maxMinutes - hours * 60) / minuteStep) * minuteStep,
        ),
      ),
    };
  }
  function commit(next: number) {
    if (next === liveTotal.current) return;
    liveTotal.current = next;
    onChangeAction(formatDuration(next));
  }
  return {
    ...limits(total),
    stepHours: (steps: number) => {
      const current = limits(liveTotal.current);
      commit(
        Math.min(current.maxHours, Math.max(0, current.hours + steps)) * 60 +
          current.minutes,
      );
    },
    stepMinutes: (steps: number) => {
      const current = limits(liveTotal.current);
      commit(
        current.hours * 60 +
          Math.min(
            current.maxMinute,
            Math.max(0, current.minutes + steps * minuteStep),
          ),
      );
    },
  };
}
