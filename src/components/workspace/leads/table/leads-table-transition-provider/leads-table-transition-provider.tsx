"use client";

import { type ReactNode, useMemo, useTransition } from "react";
import { LeadsTableTransitionContext } from "@/hooks/workspace/use-leads-table-transition";

type LeadsTableTransitionProviderProps = {
  children: ReactNode;
};

export function LeadsTableTransitionProvider({
  children,
}: LeadsTableTransitionProviderProps) {
  const [isPending, startTransition] = useTransition();
  const value = useMemo(
    () => ({ isPending, startTransition }),
    [isPending, startTransition],
  );

  return (
    <LeadsTableTransitionContext value={value}>
      {children}
    </LeadsTableTransitionContext>
  );
}
