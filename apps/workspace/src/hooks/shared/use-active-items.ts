"use client";

import { useCallback, useState } from "react";

/** Aggregates activity reported by independently mounted fields. */
export function useActiveItems() {
  const [activeIds, setActiveIds] = useState<ReadonlySet<string>>(new Set());
  const track = useCallback((id: string, active: boolean) => {
    setActiveIds((current) => {
      if (current.has(id) === active) return current;
      const next = new Set(current);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  return { activeIds, isActive: activeIds.size > 0, track };
}
