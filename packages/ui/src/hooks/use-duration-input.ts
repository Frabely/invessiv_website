"use client";

import { MINUTES_PER_HOUR } from "@invessiv/common/constants/time/time-units";
import { useEffect, useRef } from "react";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";

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
    minuteStep > MINUTES_PER_HOUR ||
    MINUTES_PER_HOUR % minuteStep !== 0
  ) {
    throw new RangeError("minuteStep must be a positive divisor of 60");
  }
  const [hourText, minuteText] = value.split(":");
  const hours = Number(hourText || 0);
  const minutes = Number(minuteText || 0);
  const total = hours * MINUTES_PER_HOUR + minutes;
  const liveTotal = useRef(total);
  useEffect(() => {
    liveTotal.current = total;
  }, [total]);

  function limits(current: number) {
    const hours = Math.floor(current / MINUTES_PER_HOUR);
    const minutes = current % MINUTES_PER_HOUR;
    return {
      hours,
      minutes,
      maxHours: Math.max(
        0,
        Math.floor((maxMinutes - minutes) / MINUTES_PER_HOUR),
      ),
      maxMinute: Math.max(
        0,
        Math.min(
          MINUTES_PER_HOUR - minuteStep,
          Math.floor((maxMinutes - hours * MINUTES_PER_HOUR) / minuteStep) *
            minuteStep,
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
        Math.min(current.maxHours, Math.max(0, current.hours + steps)) *
          MINUTES_PER_HOUR +
          current.minutes,
      );
    },
    stepMinutes: (steps: number) => {
      const current = limits(liveTotal.current);
      commit(
        current.hours * MINUTES_PER_HOUR +
          Math.min(
            current.maxMinute,
            Math.max(0, current.minutes + steps * minuteStep),
          ),
      );
    },
  };
}
