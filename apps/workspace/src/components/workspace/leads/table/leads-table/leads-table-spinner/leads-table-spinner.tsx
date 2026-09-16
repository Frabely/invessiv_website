"use client";

import { useEffect, useRef, useState } from "react";
import { DataTableLoadingOverlay } from "@invessiv/ui";
import { useLeadsTableTransition } from "@/hooks/workspace/use-leads-table-transition";

type LeadsTableSpinnerProps = {
  ariaLabel: string;
  delayMs?: number;
};

export function LeadsTableSpinner({
  ariaLabel,
  delayMs = 200,
}: LeadsTableSpinnerProps) {
  const { isPending } = useLeadsTableTransition();
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (isPending) {
      timerRef.current = setTimeout(() => setIsVisible(true), delayMs);
    } else {
      timerRef.current = setTimeout(() => setIsVisible(false), 0);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPending, delayMs]);

  if (!isVisible) return null;

  return <DataTableLoadingOverlay ariaLabel={ariaLabel} />;
}
