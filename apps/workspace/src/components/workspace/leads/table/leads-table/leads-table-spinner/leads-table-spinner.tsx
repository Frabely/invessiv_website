"use client";

import { DataTableLoadingOverlay } from "@invessiv/ui";
import { useDelayedPending } from "@/hooks/workspace/use-delayed-pending";
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
  const isVisible = useDelayedPending(isPending, delayMs);

  if (!isVisible) return null;

  return <DataTableLoadingOverlay ariaLabel={ariaLabel} />;
}
